// ─── CropParcel ──────────────────────────────────────
export interface ICropParcel {
  tunnus: string;
  lohkonumero: string;
  kasvikoodi: string;
  kasvikoodi_selite_fi: string;
  pinta_ala: number;
  luomuviljely: string;
}

// ─── Field ───────────────────────────────────────────
export interface IField {
  _id: string;
  id: string;
  name: string;
  area: number;
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: unknown[];
  };
  kasvulohkot?: ICropParcel[];  // ← lisäys
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
  name?: string;
}

export interface IWeather {
  _id: string;
  sentinelid: string;
  fieldId: string;
  date: string;
  temperature_2m_mean: number | null;
  temperature_2m_max: number | null;
  temperature_2m_min: number | null;
  relative_humidity_2m_mean: number | null;
  precipitation_sum: number | null;
  wind_speed_10m_mean: number | null;
  windspeed_10m_max: number | null;
  shortwave_radiation_sum: number | null;
  et0_fao_evapotranspiration: number | null;
  createdAt: string;
}

export type Lang = 'fi' | 'en';