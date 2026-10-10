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
exports.weather = exports.weatherAll = void 0;
const mongodb = __importStar(require("../mongo/mongodb"));
const weatherAll = async (req, res) => {
    const geometryHash = req.body.geometryHash;
    const data = await mongodb.getAllWeather(geometryHash);
    if (data.length > 0) {
        //
        //const forDate = data.find(w => w.date === "2026-04-24T00:00:00Z_f18e29d28a39d54329d9d9cfe203d70f92e4562dec61edf11d542d8ac840f115");
        //console.log("forDate: ", forDate);
        res.status(200).json(data);
    }
    else {
        res.status(404).json({ error: "no weather data found" });
    }
};
exports.weatherAll = weatherAll;
const weather = async (req, res) => {
    const { sentinelid } = req.body;
    const data = await mongodb.getWeather(sentinelid);
    if (data) {
        res.status(200).json(data);
    }
    else {
        res.status(404).json({ error: "no weather data found" });
    }
};
exports.weather = weather;
