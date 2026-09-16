import { apiClient } from '../api/client';

export interface IGrowingSeason {
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
}

export const getGrowingSeason = async (): Promise<IGrowingSeason> => {
  const res = await apiClient.get<IGrowingSeason>('/api/growing-season');
  return res.data;
};