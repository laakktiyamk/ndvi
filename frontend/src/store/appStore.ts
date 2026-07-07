import { create } from 'zustand';
import type { IField, MergedNdviEntry } from '../types';
import { getFields } from '../services/fieldService';
import { getDatesForGeometry, fetchImagesByIds } from '../services/ndviService';

interface AppState {
  // ── Fields (lista) ──────────────────────────────
  fields: IField[];
  fieldsFetched: boolean;
  fieldsLoading: boolean;
  fieldsError: string | null;
  selectedFieldId: string | null;
  recentFieldIds: string[];

  // ── Aktiivinen AOI:n NDVI-data ───────────────────
  activeGeometryHash: string | null;   // = field.id, kertoo mikä AOI on tällä hetkellä ladattu
  ndviEntries: MergedNdviEntry[];      // dates + images yhdistettynä, järjestyksessä
  imagesLoading: boolean;
  imagesError: string | null;

  // ── GeoJSON-syöte ────────────────────────────────
  geoJsonInput: string;
  validGeoJson: object | null;
  startDate: string;

  // ── Actionit ─────────────────────────────────────
  fetchFields: () => Promise<void>;
  setSelectedField: (id: string | null) => void;
  fetchImagesForField: (
    field: IField,
    startDate: string,
    endDate: string
  ) => Promise<void>;
  // Käytetään GeoJSON-syötteelle, kun field.id ei ole vielä tiedossa etukäteen
  fetchImagesForGeometry: (
    geometry: object,
    startDate: string,
    endDate: string
  ) => Promise<string | null>; // palauttaa uuden field id:n (geometryHash) tai null virheessä
  setGeoJsonInput: (text: string) => void;
  setValidGeoJson: (gj: object | null) => void;
  setStartDate: (d: string) => void;
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

  geoJsonInput: '',
  validGeoJson: null,
  startDate: '2025-04-01',

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

  fetchImagesForField: async (field, startDate, endDate) => {
    // Jo aktiivinen tämä AOI → ei toisteta hakua
    if (get().activeGeometryHash === field.id) return;
    if (get().imagesLoading) return;

    set({ imagesLoading: true, imagesError: null });
    try {
      // 1. Hae/päivitä dates (backend tsekkaa Mongon + täydentää Sentinel Hubista jos tarpeen)
      const datesRes = await getDatesForGeometry(field.geometry, startDate, endDate);
      const ids = datesRes.dates.map((d) => d.sentinelid);

      // 2. Hae kuvat niillä id:llä — palauttaa jo valmiiksi Record<sentinelid, NdviImage>
      const imagesRes = await fetchImagesByIds(ids);
      const imagesById = imagesRes.data;

      // 3. Yhdistä dates (päivämäärä + stats) ja images (pikselidata) yhdeksi listaksi
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
      });
    } catch (e: unknown) {
      set({
        imagesLoading: false,
        imagesError: e instanceof Error ? e.message : 'Haku epäonnistui',
      });
    }
  },

  fetchImagesForGeometry: async (geometry, startDate, endDate) => {
    if (get().imagesLoading) return null;
    set({ imagesLoading: true, imagesError: null });
    try {
      // 1. Hae dates raa'alle geometrialle — backend luo/päivittää dokumentin ja palauttaa id:n (geometryHash)
      const datesRes = await getDatesForGeometry(geometry, startDate, endDate);
      const ids = datesRes.dates.map((d) => d.sentinelid);

      // 2. Hae kuvat niillä id:llä
      const imagesRes = await fetchImagesByIds(ids);
      const imagesById = imagesRes.data;

      // 3. Yhdistä
      const merged: MergedNdviEntry[] = datesRes.dates.map((d) => ({
        sentinelid: d.sentinelid,
        generationtime: d.generationtime,
        stats: d.stats,
        image: imagesById[d.sentinelid],
      }));

      set({
        activeGeometryHash: datesRes.id,
        ndviEntries: merged,
        imagesLoading: false,
        // Pakota fields-lista hakemaan uudestaan, koska uusi/mahdollisesti muuttunut AOI syntyi
        fieldsFetched: false,
      });

      return datesRes.id;
    } catch (e: unknown) {
      set({
        imagesLoading: false,
        imagesError: e instanceof Error ? e.message : 'Haku epäonnistui',
      });
      return null;
    }
  },

  setGeoJsonInput: (text) => set({ geoJsonInput: text }),
  setValidGeoJson: (gj) => set({ validGeoJson: gj }),
  setStartDate: (d) => set({ startDate: d }),

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
    }),
}));
