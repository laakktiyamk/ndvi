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
exports.getWeatherFromDbOrFetch = void 0;
const mongodb = __importStar(require("../mongo/mongodb"));
const hash = __importStar(require("../utils/hash"));
const weather_1 = require("../weather/weather");
// Apufunktio: tallentaa weather-datan kannasta
const saveWeatherItems = async (_data, geometryHash) => {
    const saved = [];
    if (!_data?.daily?.time)
        return saved;
    for (let i = 0; i < _data.daily.time.length; i++) {
        const date = `${_data.daily.time[i]}T00:00:00Z`;
        const item = {
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
        saved.push(item);
    }
    return saved;
};
const getWeatherFromDbOrFetch = async (geometry, startDate, endDate) => {
    const geometryHash = hash.sha256(geometry);
    const cutoff = (0, weather_1.getArchiveCutoff)();
    try {
        const existing = await mongodb.getAllWeather(geometryHash);
        if (existing.length === 0) {
            // ── Ei dataa kannassa → hae kaikki ──────────────────────────
            try {
                const _data = await (0, weather_1.getWeatherData)(geometry, startDate, endDate);
                if (_data)
                    await saveWeatherItems(_data, geometryHash);
            }
            catch (err) {
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
                const _data = await (0, weather_1.getWeatherData)(geometry, startDate, fetchEnd);
                if (_data)
                    await saveWeatherItems(_data, geometryHash);
            }
            catch (err) {
                console.warn('Weather older range fetch failed:', err instanceof Error ? err.message : err);
            }
        }
        // 2. Loppupää: onko uusimman jälkeen uutta dataa (archive-raja huomioiden)
        const newStart = new Date(newestInDb);
        newStart.setDate(newStart.getDate() + 1);
        if (newStart < cutoff) {
            try {
                console.log(`Weather: fetching newer range ${newStart.toISOString()} → ${cutoff.toISOString()}`);
                const _data = await (0, weather_1.getWeatherData)(geometry, newStart, cutoff);
                if (_data)
                    await saveWeatherItems(_data, geometryHash);
            }
            catch (err) {
                console.warn('Weather newer range fetch failed:', err instanceof Error ? err.message : err);
            }
        }
        else {
            console.log('Weather: newest data is up to date, skipping fetch');
        }
        // Palautetaan kaikki kannasta päivitysten jälkeen
        return await mongodb.getAllWeather(geometryHash);
    }
    catch (err) {
        // Koko flow epäonnistui — ei kaadeta NDVI-requestia
        console.error('getWeatherFromDbOrFetch failed:', err instanceof Error ? err.message : err);
        return [];
    }
};
exports.getWeatherFromDbOrFetch = getWeatherFromDbOrFetch;
