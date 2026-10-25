import { apiClient } from '../api/client';
import type { IMunicipality, IMunicipalityListItem } from '../types';

export const fetchMunicipalities = async (): Promise<IMunicipalityListItem[]> => {
  const res = await apiClient.get<IMunicipalityListItem[]>('/api/municipalities');
  return res.data;
};

export const fetchMunicipality = async (kunta: string): Promise<IMunicipality> => {
  const res = await apiClient.get<IMunicipality>(`/api/municipalities/${kunta}`);
  return res.data;
};