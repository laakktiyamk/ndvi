// ─── Field ───────────────────────────────────────────
export interface IDateItem {
  generationtime: string;
  sentinelid: string;
  stats: {
    average: number;
    max: number;
    min: number;
    std: number;
  };
}

export interface IField {
  _id: string;
  id: string;          // geometrian hash — käytetään kuvien hakuun
  name: string;
  area: number;
  dates: IDateItem[];
}

// ─── NDVI ────────────────────────────────────────────
export interface NdviImage {
  _id: string;
  id: string;          // "2026-06-26T00:00:00Z_geometriahash"
  average: number;
  max: number;
  min: number;
  std: number;
  image: {
    dataUrl: string;   // "data:image/png;base64,..."
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
  scale: number[];
}

export interface INdviResult {
  _id: string;
  sentinelid: string;
  fieldId: string;
  date: string;
  ndviMean: number;
  ndviMin: number;
  ndviMax: number;
  ndviStd: number;
  classPercentages: Record<string, number>;
  createdAt: string;
}

// ─── Weather ─────────────────────────────────────────
export interface IWeather {
  _id: string;
  sentinelid: string;
  fieldId: string;
  date: string;
  temperature_2m_max: number;
  temperature_2m_min: number;
  precipitation_sum: number;
  windspeed_10m_max: number;
  createdAt: string;
}
