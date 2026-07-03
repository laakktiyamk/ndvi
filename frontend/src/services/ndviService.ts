import { apiClient } from '../api/client';
import type { INdviResult, NdviImage } from '../types';

export interface DatesList {
  dates: string[];
  sentinelid?: string;
}

// Hae päivämäärät — name välitetään tallennusta varten
export const fetchDatesList = (
  geometry: object,
  startDate: string,
  endDate: string,
  name: string = '',
) =>
  apiClient.post<DatesList>('/api/ndvi/dates', {
    geometry,
    start_date: startDate,
    end_date:   endDate,
    name,                    // ← tallennetaan dates-collectioniin
  });

export const fetchAllImages = (sentinelid: string) =>
  apiClient.get<NdviImage[]>(`/api/ndvi/image/${sentinelid}?all=true`);

export const fetchNdviResult = (sentinelid: string, date: string) =>
  apiClient.get<INdviResult>(`/api/ndvi/${sentinelid}/${date}`);
