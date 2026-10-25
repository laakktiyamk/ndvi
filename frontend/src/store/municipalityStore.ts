import { create } from 'zustand';
import type { IMunicipality, IMunicipalityListItem } from '../types';
import { fetchMunicipalities, fetchMunicipality } from '../services/municipalitiesService';
import i18n from '../i18n/i18n';

interface MunicipalityState {
  // ── Kuntalista (nimi, koodi, bbox) ───────────────
  municipalities: IMunicipalityListItem[];
  municipalitiesFetched: boolean;
  municipalitiesLoading: boolean;
  municipalitiesError: string | null;

  // ── Valittu kunta ja geometrian välimuisti ───────
  selectedKunta: string | null;
  geometryCache: Record<string, IMunicipality>;
  geometryLoading: boolean;
  geometryError: string | null;

  // ── Actionit ─────────────────────────────────────
  loadMunicipalities: () => Promise<void>;
  selectMunicipality: (kunta: string | null) => Promise<void>;
}

export const useMunicipalityStore = create<MunicipalityState>((set, get) => ({
  municipalities: [],
  municipalitiesFetched: false,
  municipalitiesLoading: false,
  municipalitiesError: null,

  selectedKunta: null,
  geometryCache: {},
  geometryLoading: false,
  geometryError: null,

  loadMunicipalities: async () => {
    if (get().municipalitiesFetched || get().municipalitiesLoading) return;
    set({ municipalitiesLoading: true, municipalitiesError: null });
    try {
      const data = await fetchMunicipalities();
      set({ municipalities: data, municipalitiesFetched: true, municipalitiesLoading: false });
    } catch (e: unknown) {
      set({
        municipalitiesError: e instanceof Error ? e.message : i18n.t('fetchFailed'),
        municipalitiesLoading: false,
      });
    }
  },

  selectMunicipality: async (kunta) => {
    set({ selectedKunta: kunta, geometryError: null });
    if (!kunta || get().geometryCache[kunta]) return;

    set({ geometryLoading: true });
    try {
      const data = await fetchMunicipality(kunta);
      set((state) => ({
        geometryCache: { ...state.geometryCache, [kunta]: data },
        geometryLoading: false,
      }));
    } catch (e: unknown) {
      set({
        geometryError: e instanceof Error ? e.message : i18n.t('fetchFailed'),
        geometryLoading: false,
      });
    }
  },
}));