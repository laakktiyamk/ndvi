
import { apiClient } from '../api/client';
import type { IWeather } from '../types';

export const getWeatherForGeometry = async (
  geometryHash: string
): Promise<IWeather[]> => {
  const res = await apiClient.post<IWeather[]>('/api/weather/all', { geometryHash });
  return res.data;
};