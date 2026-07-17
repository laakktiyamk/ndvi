import { useState, useMemo } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { createAppTheme, type Lang } from './theme/theme';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import FieldsPage from './pages/FieldsPage';
import GeoJsonPage from './pages/GeoJsonPage';
import WeatherPage from './pages/WeatherPage';
import AnalysisPage from './pages/AnalysisPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5 * 60 * 1000, retry: 1 } },
});

// Haetaan tallennetut asetukset localStoragesta — säilyvät sivulatauksen yli
const getSavedMode = (): 'light' | 'dark' =>
  (localStorage.getItem('ndvi-theme') as 'light' | 'dark') ?? 'light';

const getSavedLang = (): Lang =>
  (localStorage.getItem('ndvi-lang') as Lang) ?? 'fi';

export default function App() {
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(getSavedMode);
  const [lang, setLang] = useState<Lang>(getSavedLang);

  const toggleTheme = () => {
    const next = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(next);
    localStorage.setItem('ndvi-theme', next);
  };

  const toggleLang = () => {
    const next: Lang = lang === 'fi' ? 'en' : 'fi';
    setLang(next);
    localStorage.setItem('ndvi-lang', next);
  };

  // useMemo estää teeman uudelleenluonnin joka renderöinnillä
  const theme = useMemo(() => createAppTheme(themeMode), [themeMode]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        {/* CssBaseline asettaa body-taustan teeman mukaan */}
        <CssBaseline />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={
                <AppLayout
                  themeMode={themeMode}
                  onToggleTheme={toggleTheme}
                  lang={lang}
                  onToggleLang={toggleLang}
                />
              }>
                <Route index element={<DashboardPage />} />
                <Route path="fields" element={<FieldsPage />} />
                <Route path="geojson" element={<GeoJsonPage />} />
                <Route path="weather" element={<WeatherPage />} />
                <Route path="analysis" element={<AnalysisPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
