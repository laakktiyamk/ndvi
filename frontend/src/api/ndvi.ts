import { apiClient } from './client';

export interface NdviImage {
  _id: string;
  sentinelid: string;
  date: string;
  image: {
    dataUrl: string;       // "data:image/png;base64,..."
    width: number;
    height: number;
  };
  ndviMean: number;
  ndviMin: number;
  ndviMax: number;
  ndviStd: number;
}

export const fetchAllImages = async (sentinelid: string): Promise<NdviImage[]> => {
  const res = await apiClient.get<NdviImage[]>(`/api/images/${sentinelid}?all=true`);
  // Järjestetään päivämäärän mukaan vanhimmasta uusimpaan
  return res.data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};
