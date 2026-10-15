import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5000',
  headers: { 'Content-Type': 'application/json' },
});


export const getToken = (): string | null => {
  const s = localStorage.getItem('auth-storage');
  return s ? JSON.parse(s)?.state?.token ?? null : null;
};

// JWT lisätään automaattisesti joka pyyntöön

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401 → kirjaudu ulos
apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      //localStorage.removeItem('token');
      localStorage.removeItem('auth-storage')
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
