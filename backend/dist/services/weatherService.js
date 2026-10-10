"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWeatherFromDbOrFetch = exports.defaultWeatherStore = void 0;
const mongodb = __importStar(require("../mongo/mongodb"));
const hash = __importStar(require("../utils/hash"));
const weather_1 = require("../weather/weather");
// Oletus: Atlas (käyttäjäflow), toimii kuten ennen
exports.defaultWeatherStore = {
    saveMany: async (items) => {
        for (const item of items)
            await mongodb.saveWeather(item);
    },
    getByRange: (geometryHash, start, end) => mongodb.getWeatherByRange(geometryHash, start, end),
};
const saveWeatherItems = async (_data, geometryHash, store) => {
    if (!_data?.daily?.time)
        return;
    const items = [];
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
const getWeatherFromDbOrFetch = async (geometry, startDate, endDate, store = exports.defaultWeatherStore) => {
    const geometryHash = hash.sha256(geometry);
    const cutoff = (0, weather_1.getArchiveCutoff)();
    // Rajataan endDate kasvukauden loppuun tai cutoffiin — ei koskaan tulevaisuuteen
    const safeEnd = endDate < cutoff ? endDate : cutoff;
    if (startDate >= safeEnd) {
        console.log(`Weather: skipping ${startDate.toISOString().slice(0, 10)} → ${safeEnd.toISOString().slice(0, 10)} (future or empty range)`);
        return [];
    }
    try {
        // Haetaan kannasta vain tämän kasvukauden data
        const existing = await store.getByRange(geometryHash, startDate, safeEnd);
        if (existing.length === 0) {
            console.log(`Weather: fetching ${startDate.toISOString().slice(0, 10)} → ${safeEnd.toISOString().slice(0, 10)}`);
            try {
                const _data = await (0, weather_1.getWeatherData)(geometry, startDate, safeEnd);
                if (_data)
                    await saveWeatherItems(_data, geometryHash, store);
            }
            catch (err) {
                console.warn('Weather initial fetch failed:', err instanceof Error ? err.message : err);
            }
            return await store.getByRange(geometryHash, startDate, safeEnd);
        }
        // Alkupää: puuttuu dataa ennen vanhinta kannassa olevaa
        const oldestInDb = new Date(existing[0].date);
        if (startDate < oldestInDb) {
            const fetchEnd = new Date(oldestInDb);
            fetchEnd.setDate(fetchEnd.getDate() - 1);
            console.log(`Weather: fetching older ${startDate.toISOString().slice(0, 10)} → ${fetchEnd.toISOString().slice(0, 10)}`);
            try {
                const _data = await (0, weather_1.getWeatherData)(geometry, startDate, fetchEnd);
                if (_data)
                    await saveWeatherItems(_data, geometryHash, store);
            }
            catch (err) {
                console.warn('Weather older range fetch failed:', err instanceof Error ? err.message : err);
            }
        }
        // Loppupää: puuttuu dataa uusimman ja kasvukauden lopun väliltä
        const newestInDb = new Date(existing[existing.length - 1].date);
        const newStart = new Date(newestInDb);
        newStart.setDate(newStart.getDate() + 1);
        if (newStart < safeEnd) {
            console.log(`Weather: fetching newer ${newStart.toISOString().slice(0, 10)} → ${safeEnd.toISOString().slice(0, 10)}`);
            try {
                const _data = await (0, weather_1.getWeatherData)(geometry, newStart, safeEnd);
                if (_data)
                    await saveWeatherItems(_data, geometryHash, store);
            }
            catch (err) {
                console.warn('Weather newer range fetch failed:', err instanceof Error ? err.message : err);
            }
        }
        else {
            console.log(`Weather: ${startDate.toISOString().slice(0, 10)}–${safeEnd.toISOString().slice(0, 10)} up to date`);
        }
        return await store.getByRange(geometryHash, startDate, safeEnd);
    }
    catch (err) {
        console.error('getWeatherFromDbOrFetch failed:', err instanceof Error ? err.message : err);
        return [];
    }
};
exports.getWeatherFromDbOrFetch = getWeatherFromDbOrFetch;
