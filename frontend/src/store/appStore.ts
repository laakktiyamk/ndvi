import { create } from 'zustand';
import type { IField, NdviImage } from '../types';
import { getFields } from '../services/fieldService';
import { fetchAllImages } from '../services/ndviService';

interface AppState {
  fields: IField[];
  fieldsFetched: boolean;
  fieldsLoading: boolean;
  fieldsError: string | null;

  selectedFieldId: string | null;
  recentFieldIds: string[];

  imageCache: Record<string, NdviImage[]>;
  imagesLoading: Record<string, boolean>;

  // GeoJSON-lomake — endDate poistettu, aina tänään
  geoJsonInput: string;
  validGeoJson: object | null;
  startDate: string;

  fetchFields: () => Promise<void>;
  setSelectedField: (id: string | null) => void;
  fetchImages: (sentinelid: string) => Promise<void>;
  setGeoJsonInput: (text: string) => void;
  setValidGeoJson: (gj: object | null) => void;
  setStartDate: (d: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  fields: [],
  fieldsFetched: false,
  fieldsLoading: false,
  fieldsError: null,

  selectedFieldId: null,
  recentFieldIds: [],

  imageCache: {},
  imagesLoading: {},

  geoJsonInput: '',
  validGeoJson: null,
  startDate: '2020-01-01',

  fetchFields: async () => {
    if (get().fieldsFetched) return;
    set({ fieldsLoading: true, fieldsError: null });
    try {
      const res = await getFields();
      set({ fields: res.data, fieldsFetched: true, fieldsLoading: false });
    } catch (err: unknown) {
      set({
        fieldsError: err instanceof Error ? err.message : 'Haku epäonnistui',
        fieldsLoading: false,
      });
    }
  },

  setSelectedField: (id) => {
    set({ selectedFieldId: id });
    if (!id) return;
    set((state) => ({
      recentFieldIds: [id, ...state.recentFieldIds.filter((x) => x !== id)].slice(0, 5),
    }));
  },

  fetchImages: async (sentinelid) => {
    if (get().imageCache[sentinelid]) return;
    if (get().imagesLoading[sentinelid]) return;
    set((state) => ({ imagesLoading: { ...state.imagesLoading, [sentinelid]: true } }));
    try {
      const res = await fetchAllImages(sentinelid);
      const sorted = res.data.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      set((state) => ({
        imageCache: { ...state.imageCache, [sentinelid]: sorted },
        imagesLoading: { ...state.imagesLoading, [sentinelid]: false },
      }));
    } catch {
      set((state) => ({ imagesLoading: { ...state.imagesLoading, [sentinelid]: false } }));
    }
  },

  setGeoJsonInput: (text) => set({ geoJsonInput: text }),
  setValidGeoJson: (gj)   => set({ validGeoJson: gj }),
  setStartDate:    (d)    => set({ startDate: d }),
}));
