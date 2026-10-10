"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGrowingSeasons = getGrowingSeasons;
const growingSeason_json_1 = __importDefault(require("../settings/growingSeason.json"));
function getGrowingSeasons(fromYear, toYear) {
    const today = new Date();
    const seasons = [];
    for (let year = fromYear; year <= toYear; year++) {
        const start = new Date(`${year}-${String(growingSeason_json_1.default.startMonth).padStart(2, '0')}-${String(growingSeason_json_1.default.startDay).padStart(2, '0')}`);
        const end = new Date(`${year}-${String(growingSeason_json_1.default.endMonth).padStart(2, '0')}-${String(growingSeason_json_1.default.endDay).padStart(2, '0')}`);
        // Kasvukausi ei ole vielä alkanut — ohitetaan
        if (today < start)
            continue;
        // Kesken — leikataan tähän päivään (getWeatherData leikkaa vielä archive-rajaan)
        const effectiveEnd = today < end ? today : end;
        seasons.push({ start, end: effectiveEnd });
    }
    return seasons;
}
