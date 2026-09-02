import { create } from 'zustand';
import type { IField, IWeather, MergedNdviEntry, ICropParcel } from '../types';
import { getFields } from '../services/fieldService';
import { getDatesForGeometry, fetchImagesByIds } from '../services/ndviService';
import { getWeatherForGeometry } from '../services/weatherService';
import { deleteField as deleteFieldService } from '../services/fieldService';
import i18n from '../i18n/i18n';

interface AppState {
  // ── Fields (lista) ──────────────────────────────
  fields: IField[];
  fieldsFetched: boolean;
  fieldsLoading: boolean;
  fieldsError: string | null;
  selectedFieldId: string | null;
  recentFieldIds: string[];
  deleteField: (id: string) => Promise<boolean>;

  // ── Aktiivinen AOI:n NDVI-data ───────────────────
  activeGeometryHash: string | null;
  ndviEntries: MergedNdviEntry[];
  imagesLoading: boolean;
  imagesError: string | null;

  // ── Kasvulohkot ──────────────────────────────────
  cropParcels: ICropParcel[];

  // ── Säätiedot ────────────────────────────────────
  weatherData: IWeather[];
  weatherLoading: boolean;
  weatherError: string | null;

  // ── GeoJSON-syöte ────────────────────────────────
  geoJsonInput: string;
  validGeoJson: object | null;
  startDate: string;

  // ── UI-tila ──────────────────────────────────────
  newFieldAdded: boolean;

  // ── Actionit ─────────────────────────────────────
  fetchFields: () => Promise<void>;
  setSelectedField: (id: string | null) => void;
  fetchImagesForField: (
    field: IField,
    startDate: string,
    endDate: string
  ) => Promise<void>;
  fetchImagesForGeometry: (
    geometry: object,
    startDate: string,
    endDate: string,
    name?: string,
    cropParcels?: ICropParcel[]
  ) => Promise<string | null>;
  setGeoJsonInput: (text: string) => void;
  setValidGeoJson: (gj: object | null) => void;
  setStartDate: (d: string) => void;
  setNewFieldAdded: (v: boolean) => void;
  resetFields: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  fields: [],
  fieldsFetched: false,
  fieldsLoading: false,
  fieldsError: null,
  selectedFieldId: null,
  recentFieldIds: [],

  activeGeometryHash: null,
  ndviEntries: [],
  imagesLoading: false,
  imagesError: null,

  cropParcels: [],

  weatherData: [],
  weatherLoading: false,
  weatherError: null,

  geoJsonInput: '',
  validGeoJson: null,
  startDate: `${new Date().getFullYear()}-04-01`,

  newFieldAdded: false,

  fetchFields: async () => {
    if (get().fieldsFetched) return;
    set({ fieldsLoading: true, fieldsError: null });
    try {
      const res = await getFields();
      set({ fields: res.data, fieldsFetched: true, fieldsLoading: false });
    } catch (err: unknown) {
      set({
        fieldsError: err instanceof Error ? err.message : i18n.t('fetchFailed'),
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

  fetchImagesForField: async (field, startDate, endDate) => {
    if (get().activeGeometryHash === field.id) return;
    if (get().imagesLoading) return;

    set({ imagesLoading: true, imagesError: null });
    try {
      const datesRes = await getDatesForGeometry(field.geometry, startDate, endDate);
      const ids = datesRes.dates.map((d) => d.sentinelid);

      const imagesRes = await fetchImagesByIds(ids);
      const imagesById = imagesRes.data;

      const merged: MergedNdviEntry[] = datesRes.dates.map((d) => ({
        sentinelid: d.sentinelid,
        generationtime: d.generationtime,
        stats: d.stats,
        image: imagesById[d.sentinelid],
      }));

      set({
        activeGeometryHash: field.id,
        ndviEntries: merged,
        imagesLoading: false,
        cropParcels: field.kasvulohkot ?? [],
      });

      set({ weatherLoading: true, weatherError: null });
      getWeatherForGeometry(field.id)
        .then((data) => set({ weatherData: data, weatherLoading: false }))
        .catch((e: unknown) => set({
          weatherError: e instanceof Error ? e.message : i18n.t('weatherFailed'),
          weatherLoading: false,
        }));

    } catch (e: unknown) {
      set({
        imagesLoading: false,
        imagesError: e instanceof Error ? e.message : i18n.t('fetchFailed'),
      });
    }
  },

  fetchImagesForGeometry: async (geometry, startDate, endDate, name, cropParcels) => {
    if (get().imagesLoading) return null;
    set({ imagesLoading: true, imagesError: null });
    try {
      const datesRes = await getDatesForGeometry(
        geometry, startDate, endDate, name, cropParcels
      );
      const ids = datesRes.dates.map((d) => d.sentinelid);

      const imagesRes = await fetchImagesByIds(ids);
      const imagesById = imagesRes.data;

      const merged: MergedNdviEntry[] = datesRes.dates.map((d) => ({
        sentinelid: d.sentinelid,
        generationtime: d.generationtime,
        stats: d.stats,
        image: imagesById[d.sentinelid],
        name,
      }));

      set({
        activeGeometryHash: datesRes.id,
        ndviEntries: merged,
        imagesLoading: false,
        fieldsFetched: false,
        cropParcels: cropParcels ?? [],
      });

      set({ weatherLoading: true, weatherError: null });
      getWeatherForGeometry(datesRes.id)
        .then((data) => set({ weatherData: data, weatherLoading: false }))
        .catch((e: unknown) => set({
          weatherError: e instanceof Error ? e.message : i18n.t('weatherFailed'),
          weatherLoading: false,
        }));

      return datesRes.id;
    } catch (e: unknown) {
      set({
        imagesLoading: false,
        imagesError: e instanceof Error ? e.message : i18n.t('fetchFailed'),
      });
      return null;
    }
  },

  setGeoJsonInput: (text) => set({ geoJsonInput: text }),
  setValidGeoJson: (gj) => set({ validGeoJson: gj }),
  setStartDate: (d) => set({ startDate: d }),
  setNewFieldAdded: (v) => set({ newFieldAdded: v }),

  resetFields: () =>
    set({
      fields: [],
      fieldsFetched: false,
      fieldsError: null,
      selectedFieldId: null,
      recentFieldIds: [],
      activeGeometryHash: null,
      ndviEntries: [],
      imagesLoading: false,
      imagesError: null,
      cropParcels: [],
      weatherData: [],
      weatherLoading: false,
      weatherError: null,
      startDate: `${new Date().getFullYear()}-04-01`,
      newFieldAdded: false,
    }),

  deleteField: async (id) => {
    try {
      await deleteFieldService(id);

      if (get().selectedFieldId === id) {
        set({
          selectedFieldId: null,
          activeGeometryHash: null,
          ndviEntries: [],
          cropParcels: [],
          weatherData: [],
        });
      }

      set((state) => ({
        fields: state.fields.filter((f) => f.id !== id),
        recentFieldIds: state.recentFieldIds.filter((x) => x !== id),
      }));

      return true;
    } catch (err: unknown) {
      console.error('deleteField error:', err);
      return false;
    }
  },
}));