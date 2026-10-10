"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWeatherData = exports.getCentroid = exports.getArchiveCutoff = void 0;
const axios_1 = __importDefault(require("axios"));
const centroid_1 = __importDefault(require("@turf/centroid"));
const formatDate = (date) => date.toISOString().split("T")[0];
// Open-Meteo Archive API vaatii että endDate on vähintään 2 päivää menneisyydessä
const getArchiveCutoff = () => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 2);
    cutoff.setHours(0, 0, 0, 0);
    return cutoff;
};
exports.getArchiveCutoff = getArchiveCutoff;
const getCentroid = (geometry) => {
    const c = (0, centroid_1.default)({ type: "Feature", geometry, properties: {} });
    const [lon, lat] = c.geometry.coordinates;
    return { lat, lon };
};
exports.getCentroid = getCentroid;
const getWeatherData = async (geometry, startDate, endDate) => {
    const cutoff = (0, exports.getArchiveCutoff)();
    // Rajoitetaan endDate archive-rajaan
    const safeEndDate = endDate > cutoff ? cutoff : endDate;
    // Jos aikaväli on tyhjä tai negatiivinen, ei haeta
    if (startDate >= safeEndDate) {
        console.log(`Weather: skipping fetch, range too recent (${formatDate(startDate)} → ${formatDate(safeEndDate)})`);
        return null;
    }
    const { lat, lon } = (0, exports.getCentroid)(geometry);
    console.log(`Weather: fetching ${formatDate(startDate)} → ${formatDate(safeEndDate)}`);
    const response = await axios_1.default.get("https://archive-api.open-meteo.com/v1/archive", {
        params: {
            latitude: lat,
            longitude: lon,
            start_date: formatDate(startDate),
            end_date: formatDate(safeEndDate),
            daily: "temperature_2m_mean,temperature_2m_max,temperature_2m_min,relative_humidity_2m_mean,precipitation_sum,shortwave_radiation_sum,et0_fao_evapotranspiration,wind_speed_10m_mean",
            timezone: "UTC",
        },
    });
    return response.data;
};
exports.getWeatherData = getWeatherData;
