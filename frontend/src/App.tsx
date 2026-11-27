import { useState, useMemo } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import GlobalStyles from '@mui/material/GlobalStyles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './i18n/i18n';
import { createAppTheme } from './theme/theme';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import FieldsPage from './pages/FieldsPage';
import WeatherPage from './pages/WeatherPage';
import AnalysisPage from './pages/AnalysisPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import SettingsPage from './pages/SettingsPage';


const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5 * 60 * 1000, retry: 1 } },
});

const getSavedMode = (): 'light' | 'dark' => {
  const saved = localStorage.getItem('ndvi-theme');
  return saved === 'light' || saved === 'dark' ? saved : 'dark';
};

export default function App() {
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(getSavedMode);

  const toggleTheme = () => {
    const next = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(next);
    localStorage.setItem('ndvi-theme', next);
  };

  const theme = useMemo(() => createAppTheme(themeMode), [themeMode]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <GlobalStyles
          styles={{
            '.recharts-wrapper, .recharts-wrapper *': {
              WebkitTapHighlightColor: 'transparent',
            },
            '.recharts-wrapper:focus, .recharts-wrapper *:focus, [class^="recharts-zIndex-layer"]:focus': {
              outline: 'none',
            },
          }}
        />
        <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={
                <AppLayout
                  themeMode={themeMode}
                  onToggleTheme={toggleTheme}
                />
              }>
                <Route index element={<DashboardPage />} />
                <Route path="fields" element={<FieldsPage />} />
                <Route path="weather" element={<WeatherPage />} />
                <Route path="analysis" element={<AnalysisPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
