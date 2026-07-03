import { apiClient } from '../api/client';
import type { IWeather } from '../types';

export const fetchWeather = (sentinelid: string) =>
  apiClient.get<IWeather[]>(`/api/weather/${sentinelid}`);
