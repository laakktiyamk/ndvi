import { apiClient } from '../api/client';
import type { ICropParcel } from '../types';

export const fetchCropParcelsByGeometry = async (
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon
): Promise<ICropParcel[]> => {
  const res = await apiClient.post<ICropParcel[]>('/api/fields/crop-parcels', { geometry });
  return res.data;
};