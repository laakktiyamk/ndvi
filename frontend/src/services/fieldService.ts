import { apiClient } from '../api/client';
import type { IField } from '../types';

export const getFields = () =>
  apiClient.get<IField[]>('/api/fields');

export const createField = (data: Partial<IField>) =>
  apiClient.post<IField>('/api/fields', data);

export const deleteField = (id: string) =>
  apiClient.delete(`/api/fields/${id}`);

export type AoiStatus = 'none' | 'mine' | 'shared';

export interface AoiCheckResult {
  status: AoiStatus;
  id: string; // sama id kuin dates-dokumentilla ja /api/fields-listassa
}

export const checkAoi = async (
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon
): Promise<AoiCheckResult> => {
  const res = await apiClient.post<AoiCheckResult>('/api/fields/check-aoi', { geometry });
  return res.data;
};