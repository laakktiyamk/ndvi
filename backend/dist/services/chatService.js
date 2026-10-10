"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.askNdviQuestion = exports.askNdviQuestionXXXXXXXX = exports.askNdviQuestionxxxxx = exports.askNdviQuestionxxx = void 0;
const axios_1 = __importDefault(require("axios"));
const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
const askNdviQuestionxxx = async (question, ndviData, weatherData) => {
    const response = await axios_1.default.post(`${OLLAMA_URL}/api/generate`, {
        model: "llama3",
        prompt: `
      Olet maatalousasiantuntija. Analysoi NDVI-data ja säätiedot ja vastaa viljelijän kysymykseen.
      
      NDVI-data:
      ${JSON.stringify(ndviData, null, 2)}
      
      Säädata:
      ${JSON.stringify(weatherData, null, 2)}
      
      Kysymys: ${question}
      
      Vastaa suomeksi, lyhyesti ja selkeästi.
    `,
        stream: false,
    });
    return response.data.response;
};
exports.askNdviQuestionxxx = askNdviQuestionxxx;
const askNdviQuestionxxxxx = async (question, ndviData, weatherData) => {
    const response = await axios_1.default.post(`${OLLAMA_URL}/api/generate`, {
        model: "llama3",
        prompt: `
      Olet maatalousasiantuntija. Sinulle annetaan NDVI-data ja säätiedot.
      Laske tarvittavat keskiarvot ja tilastot itse datasta.
      Vastaa viljelijän kysymykseen datan perusteella.
      
      NDVI-data:
      ${JSON.stringify(ndviData, null, 2)}
      
      Säädata:
      ${JSON.stringify(weatherData, null, 2)}
      
      Kysymys: ${question}
      
      Vastaa suomeksi, lyhyesti ja selkeästi.
    `,
        stream: false,
    });
    return response.data.response;
};
exports.askNdviQuestionxxxxx = askNdviQuestionxxxxx;
const askNdviQuestionXXXXXXXX = async (question, ndviData, weatherData, geometry) => {
    const response = await axios_1.default.post(`${OLLAMA_URL}/api/generate`, {
        model: "llama3",
        prompt: `
      Olet maatalousasiantuntija. Sinulle annetaan NDVI-data ja säätiedot.
      Laske tarvittavat keskiarvot ja tilastot itse datasta.
      Vastaa viljelijän kysymykseen datan perusteella.
      
      AOI sijainti (GeoJSON):
      ${JSON.stringify(geometry, null, 2)}
      
      NDVI-data:
      ${JSON.stringify(ndviData, null, 2)}
      
      Säädata:
      ${JSON.stringify(weatherData, null, 2)}
      
      Kysymys: ${question}
      
      Vastaa suomeksi, lyhyesti ja selkeästi.
    `,
        stream: false,
    });
    return response.data.response;
};
exports.askNdviQuestionXXXXXXXX = askNdviQuestionXXXXXXXX;
const centroid_1 = require("@turf/centroid");
const askNdviQuestion = async (question, ndviData, weatherData, geometry) => {
    const c = (0, centroid_1.centroid)({ type: "Feature", geometry, properties: {} });
    const [lon, lat] = c.geometry.coordinates;
    const response = await axios_1.default.post(`${OLLAMA_URL}/api/generate`, {
        model: "llama3",
        prompt: `
      Olet maatalousasiantuntija. Sinulle annetaan NDVI-data ja säätiedot.
      Laske tarvittavat keskiarvot ja tilastot itse datasta.
      Vastaa viljelijän kysymykseen datan perusteella.
      
      NDVI-arvojen tulkinta:
      - 0.0-0.30: heikko kasvillisuus
      - 0.30-0.45: kohtalainen kasvillisuus
      - 0.45-0.60: tyydyttävä kasvillisuus
      - 0.60+: hyvä kasvillisuus
      
      AOI sijainti: latitude ${lat.toFixed(4)}, longitude ${lon.toFixed(4)}
      AOI tarkoittaa tässä kontekstissa "Area of Interest" eli kiinnostusalue/peltoalue.
      
      NDVI-data:
      ${JSON.stringify(ndviData, null, 2)}
      
      Säädata:
      ${JSON.stringify(weatherData, null, 2)}
      
      Kysymys: ${question}
      
      Vastaa suomeksi, lyhyesti ja selkeästi.
    `,
        stream: false,
    });
    return response.data.response;
};
exports.askNdviQuestion = askNdviQuestion;
