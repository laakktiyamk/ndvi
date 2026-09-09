import * as mongodb from "../mongo/mongodb";
import * as hash from "../utils/hash";
import { IWeather } from '../types';
import { getWeatherData, getArchiveCutoff } from '../weather/weather';

const saveWeatherItems = async (
  _data: any,
  geometryHash: string
): Promise<void> => {
  if (!_data?.daily?.time) return;

  for (let i = 0; i < _data.daily.time.length; i++) {
    const date = `${_data.daily.time[i]}T00:00:00Z`;
    const item: IWeather = {
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
    };
    await mongodb.saveWeather(item);
  }
};

export const getWeatherFromDbOrFetch = async (
  geometry: any,
  startDate: Date,
  endDate: Date
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
    const existing = await mongodb.getWeatherByRange(geometryHash, startDate, safeEnd);

    if (existing.length === 0) {
      console.log(`Weather: fetching ${startDate.toISOString().slice(0,10)} → ${safeEnd.toISOString().slice(0,10)}`);
      try {
        const _data = await getWeatherData(geometry, startDate, safeEnd);
        if (_data) await saveWeatherItems(_data, geometryHash);
      } catch (err: unknown) {
        console.warn('Weather initial fetch failed:', err instanceof Error ? err.message : err);
      }
      return await mongodb.getWeatherByRange(geometryHash, startDate, safeEnd);
    }

    // Alkupää: puuttuu dataa ennen vanhinta kannassa olevaa
    const oldestInDb = new Date(existing[0].date);
    if (startDate < oldestInDb) {
      const fetchEnd = new Date(oldestInDb);
      fetchEnd.setDate(fetchEnd.getDate() - 1);
      console.log(`Weather: fetching older ${startDate.toISOString().slice(0,10)} → ${fetchEnd.toISOString().slice(0,10)}`);
      try {
        const _data = await getWeatherData(geometry, startDate, fetchEnd);
        if (_data) await saveWeatherItems(_data, geometryHash);
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
        if (_data) await saveWeatherItems(_data, geometryHash);
      } catch (err: unknown) {
        console.warn('Weather newer range fetch failed:', err instanceof Error ? err.message : err);
      }
    } else {
      console.log(`Weather: ${startDate.toISOString().slice(0,10)}–${safeEnd.toISOString().slice(0,10)} up to date`);
    }

    return await mongodb.getWeatherByRange(geometryHash, startDate, safeEnd);

  } catch (err: unknown) {
    console.error('getWeatherFromDbOrFetch failed:', err instanceof Error ? err.message : err);
    return [];
  }
};