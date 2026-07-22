import type { TFunction } from 'i18next';

export interface NdviStatus {
  label: string;
  color: string;
}

export const getNdviStatus = (v: number, t: TFunction): NdviStatus => {
  if (v >= 0.6) return { label: t('ndviExcellent'), color: '#2E7D32' };
  if (v >= 0.4) return { label: t('ndviGood'),      color: '#689F38' };
  if (v >= 0.2) return { label: t('ndviModerate'),  color: '#F9A825' };
  return           { label: t('ndviPoor'),       color: '#C62828' };
};
