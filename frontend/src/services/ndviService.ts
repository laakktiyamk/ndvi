import { apiClient } from '../api/client';
import type { NdviImage, DateEntry, ICropParcel } from '../types';

export interface DatesResponse {
  id: string;
  name: string;
  userIds: string[];
  area: number;
  dates: DateEntry[];
  kasvulohkot?: ICropParcel[];
}

export const getDatesForGeometry = async (
  geometry: object,
  startDate: string,
  endDate: string,
  name?: string,
  cropParcels?: ICropParcel[]
): Promise<DatesResponse> => {
  const res = await apiClient.post<DatesResponse>('/api/ndvi/dates', {
    geometry,
    start_date: startDate,
    end_date: endDate,
    name,
    kasvulohkot: cropParcels ?? [],
  });
  return res.data;
};

export const fetchImagesByIds = (ids: string[]) =>
  apiClient.post<Record<string, NdviImage>>('/api/ndvi/images', { ids });

export interface ProcessField {
  geometry: object;
  name?: string;
  kasvulohkot?: ICropParcel[];
}

export interface ProcessResponse {
  jobId: string;
  total: number;
  aoiIds: string[];
  executionArn?: string;
}

export const startProcess = async (
  fields: ProcessField[],
  startDate: string,
  endDate?: string
): Promise<ProcessResponse> => {
  const res = await apiClient.post<ProcessResponse>('/process', {
    start_date: startDate,
    end_date: endDate,
    fields: fields.map((f) => ({
      geometry: f.geometry,
      name: f.name ?? '',
      kasvulohkot: f.kasvulohkot ?? [],
    })),
  });
  return res.data;
};