import type { ICropParcelStats } from '../types';

/** Yksi kasvulohkosarja chartia varten. */
export interface CropParcelSeries {
  /** Recharts dataKey, esim. "p_0040094039_1" (ei pisteitä → ei sisäkkäistä polkua). */
  key: string;
  peruslohkotunnus: string;
  lohkonumero: string;
  kasvikoodi?: string;
  /** date (YYYY-MM-DD) → mean */
  values: Map<string, number>;
}

/** Yhdistysavain: geometria (cropParcels), tilastot (cropParcelStats) ja chartin sarja. */
export const parcelKey = (peruslohkotunnus: string, lohkonumero: string | number) =>
  `p_${peruslohkotunnus}_${String(lohkonumero)}`;

/**
 * Avain kasvulohko-objektille (ICropParcel).
 * @remarks Vanhoilta vuosilta (2020, 2021, 2023) puuttuu tunnus, joten avain
 * muodostetaan peruslohkotunnuksesta + lohkonumerosta. Varalla tunnus, jos
 * peruslohkotunnus puuttuu (vanhat dates-dokumentin kasvulohkot).
 */
export const cropParcelKey = (p: {
  peruslohkotunnus?: string;
  lohkonumero: string | number;
  tunnus?: string;
}): string =>
  p.peruslohkotunnus
    ? parcelKey(p.peruslohkotunnus, p.lohkonumero)
    : `t_${p.tunnus ?? String(p.lohkonumero)}`;

/**
 * Valitsee vuoden lohkotilastot ja muuttaa ne sarjoiksi.
 * @param stats - storen cropParcelStats (kaikki kaudet)
 * @param year - valittu vuosi (number), vertailu stringinä
 */
export function buildCropParcelSeries(
  stats: ICropParcelStats[],
  year: number | null
): CropParcelSeries[] {
  if (year == null) return [];
  const y = String(year);

  return stats
    .filter((s) => s.vuosi === y && s.stats.length > 0)
    .map((s) => ({
      key: parcelKey(s.peruslohkotunnus, s.lohkonumero),
      peruslohkotunnus: s.peruslohkotunnus,
      lohkonumero: s.lohkonumero,
      kasvikoodi: s.kasvikoodi,
      values: new Map(s.stats.map((p) => [p.date, p.mean])),
    }));
}

/**
 * Lisää chartin riveihin lohkojen arvot. Puuttuva päivä → null,
 * jolloin <Line connectNulls> jatkaa viivaa.
 * @param rows - chartin nykyiset rivit
 * @param getDate - palauttaa rivin päivän (ISO), lyhennetään YYYY-MM-DD:ksi
 */
export function mergeParcelValues<T extends object>(
  rows: T[],
  series: CropParcelSeries[],
  getDate: (row: T) => string
): (T & Record<string, number | null>)[] {
  return rows.map((row) => {
    const date = getDate(row).slice(0, 10);
    const extra: Record<string, number | null> = {};
    for (const s of series) extra[s.key] = s.values.get(date) ?? null;
    return { ...row, ...extra };
  });
}