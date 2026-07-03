import * as mongodb from "../mongo/mongodb";
import * as hash from "../utils/hash";
import { IWeather } from '../types';
import { getWeatherData, getArchiveCutoff } from '../weather/weather';

// Apufunktio: tallentaa weather-datan kannasta
const saveWeatherItems = async (
  _data: any,
  geometryHash: string
): Promise<IWeather[]> => {
  const saved: IWeather[] = [];
  if (!_data?.daily?.time) return saved;

  for (let i = 0; i < _data.daily.time.length; i++) {
    const date = `${_data.daily.time[i]}T00:00:00Z`;
    const item: IWeather = {
      sentinelid: `${date}_${geometryHash}`,
      date,
      geometryHash,
      temperature_2m_mean:        _data.daily.temperature_2m_mean[i] ?? null,
      precipitation_sum:          _data.daily.precipitation_sum[i] ?? null,
      shortwave_radiation_sum:    _data.daily.shortwave_radiation_sum[i] ?? null,
      et0_fao_evapotranspiration: _data.daily.et0_fao_evapotranspiration[i] ?? null,
    };
    await mongodb.saveWeather(item);
    saved.push(item);
  }
  return saved;
};

export const getWeatherFromDbOrFetch = async (
  geometry: any,
  startDate: Date,
  endDate: Date
): Promise<IWeather[]> => {
  const geometryHash = hash.sha256(geometry);
  const cutoff = getArchiveCutoff();

  try {
    const existing = await mongodb.getAllWeather(geometryHash);

    if (existing.length === 0) {
      // ── Ei dataa kannassa → hae kaikki ──────────────────────────
      try {
        const _data = await getWeatherData(geometry, startDate, endDate);
        if (_data) await saveWeatherItems(_data, geometryHash);
      } catch (err: unknown) {
        console.warn('Weather initial fetch failed:', err instanceof Error ? err.message : err);
      }
      return await mongodb.getAllWeather(geometryHash);
    }

    // ── Dataa on kannassa → tarkistetaan molemmat suunnat ────────
    const oldestInDb = new Date(existing[0].date);
    const newestInDb = new Date(existing[existing.length - 1].date);

    // 1. Alkupää: käyttäjän startDate on ennen kannassa olevaa vanhinta
    if (startDate < oldestInDb) {
      const fetchEnd = new Date(oldestInDb);
      fetchEnd.setDate(fetchEnd.getDate() - 1); // päivää ennen vanhinta
      try {
        console.log(`Weather: fetching older range ${startDate.toISOString()} → ${fetchEnd.toISOString()}`);
        const _data = await getWeatherData(geometry, startDate, fetchEnd);
        if (_data) await saveWeatherItems(_data, geometryHash);
      } catch (err: unknown) {
        console.warn('Weather older range fetch failed:', err instanceof Error ? err.message : err);
      }
    }

    // 2. Loppupää: onko uusimman jälkeen uutta dataa (archive-raja huomioiden)
    const newStart = new Date(newestInDb);
    newStart.setDate(newStart.getDate() + 1);

    if (newStart < cutoff) {
      try {
        console.log(`Weather: fetching newer range ${newStart.toISOString()} → ${cutoff.toISOString()}`);
        const _data = await getWeatherData(geometry, newStart, cutoff);
        if (_data) await saveWeatherItems(_data, geometryHash);
      } catch (err: unknown) {
        console.warn('Weather newer range fetch failed:', err instanceof Error ? err.message : err);
      }
    } else {
      console.log('Weather: newest data is up to date, skipping fetch');
    }

    // Palautetaan kaikki kannasta päivitysten jälkeen
    return await mongodb.getAllWeather(geometryHash);

  } catch (err: unknown) {
    // Koko flow epäonnistui — ei kaadeta NDVI-requestia
    console.error('getWeatherFromDbOrFetch failed:', err instanceof Error ? err.message : err);
    return [];
  }
};
