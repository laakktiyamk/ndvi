import * as mongodb from "../mongo/mongodb";
import * as hash from "../utils/hash";
import { IWeather } from '../types';
import { getWeatherData, getArchiveCutoff } from '../weather/weather';

// Mihin säädata tallennetaan ja mistä se luetaan
export interface WeatherStore {
  saveMany: (items: IWeather[]) => Promise<void>;
  getByRange: (geometryHash: string, start: Date, end: Date) => Promise<IWeather[]>;
}

// Oletus: Atlas (käyttäjäflow), toimii kuten ennen
export const defaultWeatherStore: WeatherStore = {
  saveMany: async (items) => {
    for (const item of items) await mongodb.saveWeather(item);
  },
  getByRange: (geometryHash, start, end) =>
    mongodb.getWeatherByRange(geometryHash, start, end),
};

const saveWeatherItems = async (
  _data: any,
  geometryHash: string,
  store: WeatherStore
): Promise<void> => {
  if (!_data?.daily?.time) return;

  const items: IWeather[] = [];
  for (let i = 0; i < _data.daily.time.length; i++) {
    const date = `${_data.daily.time[i]}T00:00:00Z`;
    items.push({
      sentinelid: `${date}_${geometryHash}`,
      date,
      geometryHash,
      temperature_2m_mean: _data.daily.temperature_2m_mean[i] ?? null,
      precipitation_sum: _data.daily.precipitation_sum[i] ?? null,
      shortwave_radiation_sum: _data.daily.shortwave_radiation_sum[i] ?? null,
      et0_fao_evapotranspiration: _data.daily.et0_fao_evapotranspiration[i] ?? null,
      temperature_2m_max: _data.daily.temperature_2m_max?.[i] ?? null,
      temperature_2m_min: _data.daily.temperature_2m_min?.[i] ?? null,
      relative_humidity_2m_mean: _data.daily.relative_humidity_2m_mean?.[i] ?? null,
      wind_speed_10m_mean: _data.daily.wind_speed_10m_mean?.[i] ?? null,
    });
  }
  await store.saveMany(items);
};

export const getWeatherFromDbOrFetch = async (
  geometry: any,
  startDate: Date,
  endDate: Date,
  store: WeatherStore = defaultWeatherStore
): Promise<IWeather[]> => {
  const geometryHash = hash.sha256(geometry);
  const cutoff = getArchiveCutoff();

  // Rajataan endDate kasvukauden loppuun tai cutoffiin — ei koskaan tulevaisuuteen
  const safeEnd = endDate < cutoff ? endDate : cutoff;

  if (startDate >= safeEnd) {
    console.log(`Weather: skipping ${startDate.toISOString().slice(0,10)} → ${safeEnd.toISOString().slice(0,10)} (future or empty range)`);
    return [];
  }

  try {
    // Haetaan kannasta vain tämän kasvukauden data
    const existing = await store.getByRange(geometryHash, startDate, safeEnd);

    if (existing.length === 0) {
      console.log(`Weather: fetching ${startDate.toISOString().slice(0,10)} → ${safeEnd.toISOString().slice(0,10)}`);
      try {
        const _data = await getWeatherData(geometry, startDate, safeEnd);
        if (_data) await saveWeatherItems(_data, geometryHash, store);
      } catch (err: unknown) {
        console.warn('Weather initial fetch failed:', err instanceof Error ? err.message : err);
      }
      return await store.getByRange(geometryHash, startDate, safeEnd);
    }

    // Alkupää: puuttuu dataa ennen vanhinta kannassa olevaa
    const oldestInDb = new Date(existing[0].date);
    if (startDate < oldestInDb) {
      const fetchEnd = new Date(oldestInDb);
      fetchEnd.setDate(fetchEnd.getDate() - 1);
      console.log(`Weather: fetching older ${startDate.toISOString().slice(0,10)} → ${fetchEnd.toISOString().slice(0,10)}`);
      try {
        const _data = await getWeatherData(geometry, startDate, fetchEnd);
        if (_data) await saveWeatherItems(_data, geometryHash, store);
      } catch (err: unknown) {
        console.warn('Weather older range fetch failed:', err instanceof Error ? err.message : err);
      }
    }

    // Loppupää: puuttuu dataa uusimman ja kasvukauden lopun väliltä
    const newestInDb = new Date(existing[existing.length - 1].date);
    const newStart = new Date(newestInDb);
    newStart.setDate(newStart.getDate() + 1);

    if (newStart < safeEnd) {
      console.log(`Weather: fetching newer ${newStart.toISOString().slice(0,10)} → ${safeEnd.toISOString().slice(0,10)}`);
      try {
        const _data = await getWeatherData(geometry, newStart, safeEnd);
        if (_data) await saveWeatherItems(_data, geometryHash, store);
      } catch (err: unknown) {
        console.warn('Weather newer range fetch failed:', err instanceof Error ? err.message : err);
      }
    } else {
      console.log(`Weather: ${startDate.toISOString().slice(0,10)}–${safeEnd.toISOString().slice(0,10)} up to date`);
    }

    return await store.getByRange(geometryHash, startDate, safeEnd);

  } catch (err: unknown) {
    console.error('getWeatherFromDbOrFetch failed:', err instanceof Error ? err.message : err);
    return [];
  }
};