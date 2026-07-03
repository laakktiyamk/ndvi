import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { theme } from './theme/theme';
import AppLayout from './components/layout/AppLayout';
import DashboardPage from './pages/DashboardPage';
import FieldsPage from './pages/FieldsPage';
import GeoJsonPage from './pages/GeoJsonPage';
import WeatherPage from './pages/WeatherPage';
import AnalysisPage from './pages/AnalysisPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5 * 60 * 1000, retry: 1 } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="fields" element={<FieldsPage />} />
              <Route path="geojson" element={<GeoJsonPage />} />
              <Route path="weather" element={<WeatherPage />} />
              <Route path="analysis" element={<AnalysisPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
