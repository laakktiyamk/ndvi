import { apiClient } from '../api/client';

interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    username: string;
  };
}

interface RegisterResponse {
  message: string;
  user: {
    id: string;
    email: string;
    username: string;
  };
}

export const login = (email: string, password: string) =>
  apiClient.post<AuthResponse>('/api/user/login', { email, password });

export const register = (email: string, password: string, username: string) =>
  apiClient.post<RegisterResponse>('/api/user/register', { email, password, username });
