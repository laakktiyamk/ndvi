// ndviFilmrollUtils.ts
// Shared types and helpers for NdviFilmroll.
// Drop alongside your existing ndviUtils / colorUtils.

export interface NdviImageEntry {
  date: string           // ISO-8601, e.g. "2024-06-11"
  imageUrl: string       // presigned S3 URL or CDSE tile URL
  ndviMean: number       // –1 … 1
  ndviMin: number
  ndviMax: number
  cloudCoverPct: number  // 0–100, from SCL mask
}

// ── colour scale ────────────────────────────────────────────────────────────
// Mirrors the 9-class evalscript palette you already use on the backend.
// Returns MUI-compatible colour strings.

export type NdviClass =
  | 'no-data'
  | 'water'
  | 'bare'
  | 'sparse'
  | 'low'
  | 'moderate'
  | 'good'
  | 'very-good'
  | 'excellent'

interface NdviClassMeta {
  label: string
  labelFi: string
  color: string        // chip / badge bg  (dark, for dark film strip)
  textColor: string    // chip text
  muiColor: string     // LinearProgress bar colour (light theme compatible)
}

const CLASS_META: Record<NdviClass, NdviClassMeta> = {
  'no-data':  { label: 'No data',   labelFi: 'Ei dataa',      color: '#2a2a2a', textColor: '#888',    muiColor: '#9e9e9e' },
  'water':    { label: 'Water',      labelFi: 'Vesi',          color: '#0a1a3a', textColor: '#5090d0', muiColor: '#1565c0' },
  'bare':     { label: 'Bare soil',  labelFi: 'Paljas maa',    color: '#3a1a00', textColor: '#e08030', muiColor: '#e65100' },
  'sparse':   { label: 'Sparse',     labelFi: 'Niukka',        color: '#2e2200', textColor: '#c8a020', muiColor: '#f9a825' },
  'low':      { label: 'Low',        labelFi: 'Matala',        color: '#2c2a00', textColor: '#b8c030', muiColor: '#afb42b' },
  'moderate': { label: 'Moderate',   labelFi: 'Kohtalainen',   color: '#1a2c00', textColor: '#8cc850', muiColor: '#558b2f' },
  'good':     { label: 'Good',       labelFi: 'Hyvä',          color: '#0e2e0e', textColor: '#5db85d', muiColor: '#2e7d32' },
  'very-good':{ label: 'Very good',  labelFi: 'Erittäin hyvä', color: '#082008', textColor: '#4eca4e', muiColor: '#1b5e20' },
  'excellent':{ label: 'Excellent',  labelFi: 'Erinomainen',   color: '#041804', textColor: '#3de03d', muiColor: '#004d00' },
}

export function getNdviClass(ndvi: number): NdviClass {
  if (ndvi < -0.1) return 'water'
  if (ndvi < 0.05) return 'bare'
  if (ndvi < 0.15) return 'sparse'
  if (ndvi < 0.25) return 'low'
  if (ndvi < 0.40) return 'moderate'
  if (ndvi < 0.55) return 'good'
  if (ndvi < 0.70) return 'very-good'
  return 'excellent'
}

export function getNdviMeta(ndvi: number): NdviClassMeta {
  return CLASS_META[getNdviClass(ndvi)]
}

// Maps –1…1 to 0…100 for LinearProgress / position indicator
export function ndviToPercent(ndvi: number): number {
  return Math.round(((ndvi + 1) / 2) * 100)
}
