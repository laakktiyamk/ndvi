import { useState, useMemo } from 'react';
import {
  Box, Typography, Paper, FormControl, InputLabel,
  Select, MenuItem, CircularProgress, Alert,
} from '@mui/material';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { useAppStore } from '../store/appStore';

// ── Suureet ──────────────────────────────────────────────────────────────────
const VARIABLES = [
  { key: 'temperature_2m_mean', label: 'Keskilämpötila',    unit: '°C',    color: '#C62828' },
  { key: 'temperature_2m_max',  label: 'Lämpötila max',     unit: '°C',    color: '#E53935' },
  { key: 'temperature_2m_min',  label: 'Lämpötila min',     unit: '°C',    color: '#1565C0' },
  { key: 'precipitation_sum',   label: 'Sademäärä',         unit: 'mm',    color: '#1976D2' },
  { key: 'shortwave_radiation_sum', label: 'Auringonsäteily', unit: 'MJ/m²', color: '#F9A825' },
  { key: 'et0_fao_evapotranspiration', label: 'ET₀',        unit: 'mm',    color: '#2E7D32' },
  { key: 'relative_humidity_2m_mean',  label: 'Kosteus',    unit: '%',     color: '#00838F' },
  { key: 'wind_speed_10m_mean', label: 'Tuulen nopeus',     unit: 'm/s',   color: '#546E7A' },
] as const;

type VarKey = typeof VARIABLES[number]['key'];

const fmtShort = (iso: string) => {
  const d = new Date(iso);
  return `${d.getDate()}.${d.getMonth() + 1}.`;
};

const getYear = (iso: string) => new Date(iso).getFullYear();

export default function WeatherPage() {
  const { fields, activeGeometryHash, ndviEntries, weatherData, weatherLoading, weatherError } = useAppStore();
  const activeField = fields.find(f => f.id === activeGeometryHash);

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedVar, setSelectedVar] = useState<VarKey>('temperature_2m_mean');

  // Saatavilla olevat vuodet weatherData:sta
  const availableYears = useMemo(() => {
    const years = [...new Set(weatherData.map(w => getYear(w.date)))].sort((a, b) => b - a);
    return years.length > 0 ? years : [currentYear];
  }, [weatherData]);

  // Filtteröity ja lajiteltu data valitulle vuodelle
  const chartData = useMemo(() => {
    return weatherData
      .filter(w => getYear(w.date) === selectedYear)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(w => ({
        label: fmtShort(w.date),
        date: w.date,
        value: w[selectedVar] != null ? Math.round((w[selectedVar] as number) * 10) / 10 : null,
      }));
  }, [weatherData, selectedYear, selectedVar]);

  const varMeta = VARIABLES.find(v => v.key === selectedVar)!;

  // Keskiarvo referenssiviivaa varten
  const avg = useMemo(() => {
    const vals = chartData.map(d => d.value).filter((v): v is number => v != null);
    return vals.length > 0 ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;
  }, [chartData]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Otsikko */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WbSunnyIcon color="primary" />
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Sää{activeField ? ` — ${activeField.name}` : ''}
        </Typography>
      </Box>

      {weatherLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {weatherError && <Alert severity="error">{weatherError}</Alert>}

      {!weatherLoading && weatherData.length === 0 && (
        <Alert severity="info">Säädataa ei saatavilla. Avaa lohko ensin Lohkot-sivulta.</Alert>
      )}

      {weatherData.length > 0 && (
        <Paper sx={{ p: 2.5 }}>
          {/* Kontrollit: vuosi + suure */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Vuosi</InputLabel>
              <Select
                value={selectedYear}
                label="Vuosi"
                onChange={e => setSelectedYear(Number(e.target.value))}
              >
                {availableYears.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Suure</InputLabel>
              <Select
                value={selectedVar}
                label="Suure"
                onChange={e => setSelectedVar(e.target.value as VarKey)}
              >
                {VARIABLES.map(v => (
                  <MenuItem key={v.key} value={v.key}>
                    {v.label} ({v.unit})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {avg != null && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto' }}>
                <Typography variant="caption" color="text.secondary">Keskiarvo:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: varMeta.color }}>
                  {avg} {varMeta.unit}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Linechart */}
          {chartData.length === 0 ? (
            <Typography color="text.secondary" variant="body2">
              Ei dataa vuodelle {selectedYear}.
            </Typography>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  width={48}
                  tickFormatter={v => `${v}${varMeta.unit}`}
                />
                <Tooltip
                  formatter={(v) => [`${v} ${varMeta.unit}`, varMeta.label]}
                  labelFormatter={l => l}
                />
                {avg != null && (
                  <ReferenceLine
                    y={avg}
                    stroke={varMeta.color}
                    strokeDasharray="4 2"
                    strokeOpacity={0.5}
                    label={{ value: `Ø ${avg}`, fontSize: 10, fill: varMeta.color, position: 'right' }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={varMeta.color}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Paper>
      )}
    </Box>
  );
}
