import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAppStore } from './appStore';

interface User {
  id: string;
  email: string;
  username: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;

  setAuth: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      setAuth: (token, user) => {
        set({ token, user, isAuthenticated: true });
      },

      logout: () => {
        // Poistetaan vanhat manuaaliset avaimet
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        useAppStore.getState().resetFields();
        set({ token: null, user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',  // localStorage-avain
    }
  )
);