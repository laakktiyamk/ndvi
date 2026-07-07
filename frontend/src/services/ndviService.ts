import { apiClient } from '../api/client';
import type { NdviImage, DateEntry } from '../types';

export interface DatesResponse {
  id: string;
  name: string;
  userIds: string[];
  area: number;
  dates: DateEntry[];
}

export const getDatesForGeometry = async (
  geometry: object,
  startDate: string,
  endDate: string
): Promise<DatesResponse> => {
  const res = await apiClient.post<DatesResponse>('/api/ndvi/dates', {
    geometry,
    start_date: startDate,
    end_date: endDate,
  });
  return res.data;
};

export const fetchImagesByIds = (ids: string[]) =>
  apiClient.post<Record<string, NdviImage>>('/api/ndvi/images', { ids });
