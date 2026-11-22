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

export const register = (
  email: string,
  password: string,
  username: string,
  clientId: string,
  clientSecret: string,
  lang: 'fi' | 'en'
) =>
  apiClient.post<RegisterResponse>('/api/user/register', {
    email, password, username, clientId, clientSecret, lang,
  });

interface MessageResponse {
  message: string;
}


interface CdseStatusResponse {
  connected: boolean;
  verifiedAt: string | null;
}

interface CodeResponse {
  code: string;
}

export const forgotPassword = (email: string, lang: string) =>
  apiClient.post<MessageResponse>('/api/user/forgot-password', { email, lang });

export const resetPassword = (token: string, password: string) =>
  apiClient.patch<MessageResponse>('/api/user/reset-password', { token, password });

export const verifyEmail = (token: string) =>
  apiClient.post<MessageResponse>('/api/user/verify-email', { token });

export const getCdseStatus = () =>
  apiClient.get<CdseStatusResponse>('/api/user/cdse-credentials');

export const updateCdseCredentials = (clientId: string, clientSecret: string) =>
  apiClient.put<CodeResponse>('/api/user/cdse-credentials', { clientId, clientSecret });

export const deleteCdseCredentials = () =>
  apiClient.delete<CodeResponse>('/api/user/cdse-credentials');

/**
 * Poistaa kirjautuneen käyttäjän tilin pysyvästi.
 *
 * @remarks
 * Axiosissa DELETE-pyynnön body annetaan `data`-kentässä,
 * koska `axios.delete` ei ota bodya toisena parametrina.
 *
 * @param password - Käyttäjän nykyinen salasana vahvistukseksi
 */
export const deleteAccount = (password: string) =>
  apiClient.delete('/api/user', { data: { password } });