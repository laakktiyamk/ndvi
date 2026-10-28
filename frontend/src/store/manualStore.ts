import { create } from 'zustand';

interface ManualState {
  open: boolean;
  anchor: string | null;
  openManual: (anchor?: string) => void;
  closeManual: () => void;
}

export const useManualStore = create<ManualState>((set) => ({
  open: false,
  anchor: null,
  openManual: (anchor) => set({ open: true, anchor: anchor ?? null }),
  closeManual: () => set({ open: false }),
}));