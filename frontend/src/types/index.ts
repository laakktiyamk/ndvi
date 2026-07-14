// ─── Field ───────────────────────────────────────────
export interface IField {
  _id: string;
  id: string;                // geometrian hash — käytetään kuvien/dates-hakuun
  name: string;
  area: number;
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: unknown[];
  };
}

// ─── NDVI ────────────────────────────────────────────

export interface NdviImage {
  _id: string;
  id: string;
  average: number;
  max: number;
  min: number;
  std: number;
  image: {
    dataUrl: string;
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
  scale: { color: string; amount: number; from: number }[];
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
  date: string;
  geometryHash?: string;
  temperature_2m_mean: number | null;
  temperature_2m_max: number | null;
  temperature_2m_min: number | null;
  relative_humidity_2m_mean: number | null;
  precipitation_sum: number | null;
  shortwave_radiation_sum: number | null;
  et0_fao_evapotranspiration: number | null;
  createdAt: string;
}

// ─── Dates (per-päivä stats + sentinelid) ────────────
export interface DateEntry {
  generationtime: string;
  sentinelid: string;
  stats: {
    average: number;
    max: number;
    min: number;
    std: number;
  };
}

// ─── Yhdistetty näkymämalli: dates + images ──────────
export interface MergedNdviEntry {
  sentinelid: string;
  generationtime: string;
  stats: { average: number; max: number; min: number; std: number };
  image: NdviImage | undefined;
}

export interface IWeather {
  _id: string;
  sentinelid: string;
  fieldId: string;
  date: string;
  temperature_2m_max: number | null;
  temperature_2m_min: number | null;
  precipitation_sum: number | null;
  windspeed_10m_max: number;
  shortwave_radiation_sum: number | null;
  et0_fao_evapotranspiration: number | null;
  createdAt: string;
  wind_speed_10m_mean: number | null;
}