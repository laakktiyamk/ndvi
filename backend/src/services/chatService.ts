import axios from "axios";

const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";

export const askNdviQuestionxxx = async (
  question: string,
  ndviData: any,
  weatherData: any[]
): Promise<string> => {
  const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
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

export const askNdviQuestionxxxxx = async (
  question: string,
  ndviData: any,
  weatherData: any[]
): Promise<string> => {
  const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
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

export const askNdviQuestionXXXXXXXX = async (
  question: string,
  ndviData: any,
  weatherData: any[],
  geometry: any
): Promise<string> => {
  const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
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

import { centroid } from "@turf/centroid";

export const askNdviQuestion = async (
  question: string,
  ndviData: any,
  weatherData: any[],
  geometry: any
): Promise<string> => {
  const c = centroid({ type: "Feature", geometry, properties: {} });
  const [lon, lat] = c.geometry.coordinates;

  const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
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