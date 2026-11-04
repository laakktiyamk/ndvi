import { apiClient } from '../api/client';
import type { ICropParcel } from '../types';

// Vanhoilta vuosilta (2020–2023) tunnus puuttuu: korvataan se
// avaimella peruslohkotunnus + lohkonumero, joka on yksilöivä vuoden sisällä
type RawParcel = Omit<ICropParcel, 'tunnus'> & {
  tunnus?: string;
  peruslohkotunnus?: string;
};

export const fetchCropParcelsByGeometry = async (
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon,
  vuosi?: number
): Promise<ICropParcel[]> => {
  const res = await apiClient.post<RawParcel[]>('/api/fields/crop-parcels', {
    geometry,
    ...(vuosi !== undefined && { vuosi }),
  });
  return res.data.map((p) => ({
    ...p,
    tunnus: p.tunnus ?? `${p.peruslohkotunnus}-${p.lohkonumero}`,
  })) as ICropParcel[];
};