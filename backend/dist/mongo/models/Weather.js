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
exports.Weather = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const weatherSchema = new mongoose_1.Schema({
    sentinelid: { type: String, required: true, unique: true },
    date: { type: String, required: true },
    geometryHash: { type: String, required: true },
    temperature_2m_mean: { type: Number, default: null },
    temperature_2m_max: { type: Number, default: null },
    temperature_2m_min: { type: Number, default: null },
    relative_humidity_2m_mean: { type: Number, default: null },
    precipitation_sum: { type: Number, default: null },
    shortwave_radiation_sum: { type: Number, default: null },
    et0_fao_evapotranspiration: { type: Number, default: null },
    wind_speed_10m_mean: { type: Number, default: null },
});
const WeatherModel = mongoose_1.default.model("Weather", weatherSchema);
exports.Weather = WeatherModel;
