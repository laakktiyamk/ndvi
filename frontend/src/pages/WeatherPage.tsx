import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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

const VARIABLE_KEYS = [
  'temperature_2m_mean',
  'temperature_2m_max',
  'temperature_2m_min',
  'precipitation_sum',
  'shortwave_radiation_sum',
  'et0_fao_evapotranspiration',
  'relative_humidity_2m_mean',
  'wind_speed_10m_mean',
] as const;

type VarKey = typeof VARIABLE_KEYS[number];

const VARIABLE_UNITS: Record<VarKey, string> = {
  temperature_2m_mean: '°C',
  temperature_2m_max: '°C',
  temperature_2m_min: '°C',
  precipitation_sum: 'mm',
  shortwave_radiation_sum: 'MJ/m²',
  et0_fao_evapotranspiration: 'mm',
  relative_humidity_2m_mean: '%',
  wind_speed_10m_mean: 'm/s',
};

const VARIABLE_COLORS: Record<VarKey, string> = {
  temperature_2m_mean: '#C62828',
  temperature_2m_max: '#E53935',
  temperature_2m_min: '#1565C0',
  precipitation_sum: '#1976D2',
  shortwave_radiation_sum: '#F9A825',
  et0_fao_evapotranspiration: '#2E7D32',
  relative_humidity_2m_mean: '#00838F',
  wind_speed_10m_mean: '#546E7A',
};

const VARIABLE_LABEL_KEYS: Record<VarKey, string> = {
  temperature_2m_mean: 'avgTemp',
  temperature_2m_max: 'maxTemp',
  temperature_2m_min: 'minTemp',
  precipitation_sum: 'precipitation',
  shortwave_radiation_sum: 'radiation',
  et0_fao_evapotranspiration: 'et0',
  relative_humidity_2m_mean: 'humidity',
  wind_speed_10m_mean: 'maxWind',
};

const fmtShort = (iso: string, lang = 'fi') => {
  const d = new Date(iso);
  return d.toLocaleDateString(lang === 'fi' ? 'fi-FI' : 'en-GB', {
    day: 'numeric',
    month: 'numeric',
  });
};

const getYear = (iso: string) => new Date(iso).getFullYear();

export default function WeatherPage() {
  const { t, i18n } = useTranslation();
  const { fields, activeGeometryHash, weatherData, weatherLoading, weatherError } = useAppStore();
  const activeField = fields.find(f => f.id === activeGeometryHash);

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedVar, setSelectedVar] = useState<VarKey>('temperature_2m_mean');

  const availableYears = useMemo(() => {
    const years = [...new Set(weatherData.map(w => getYear(w.date)))].sort((a, b) => b - a);
    return years.length > 0 ? years : [currentYear];
  }, [weatherData]);

  const chartData = useMemo(() => {
    return weatherData
      .filter(w => getYear(w.date) === selectedYear)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(w => ({
        label: fmtShort(w.date, i18n.language),
        date: w.date,
        value: w[selectedVar] != null ? Math.round((w[selectedVar] as number) * 10) / 10 : null,
      }));
  }, [weatherData, selectedYear, selectedVar, i18n.language]);

  const varUnit = VARIABLE_UNITS[selectedVar];
  const varColor = VARIABLE_COLORS[selectedVar];
  const varLabel = t(VARIABLE_LABEL_KEYS[selectedVar]);

  const avg = useMemo(() => {
    const vals = chartData.map(d => d.value).filter((v): v is number => v != null);
    return vals.length > 0 ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;
  }, [chartData]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WbSunnyIcon color="primary" />
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {t('weather')}{activeField ? ` — ${activeField.name}` : ''}
        </Typography>
      </Box>

      {weatherLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {weatherError && <Alert severity="error">{weatherError}</Alert>}

      {!weatherLoading && weatherData.length === 0 && (
        <Alert severity="info">{t('noWeatherOpen')}</Alert>
      )}

      {weatherData.length > 0 && (
        <Paper sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>{t('year')}</InputLabel>
              <Select
                value={selectedYear}
                label={t('year')}
                onChange={e => setSelectedYear(Number(e.target.value))}
              >
                {availableYears.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>{t('variable')}</InputLabel>
              <Select
                value={selectedVar}
                label={t('variable')}
                onChange={e => setSelectedVar(e.target.value as VarKey)}
              >
                {VARIABLE_KEYS.map(key => (
                  <MenuItem key={key} value={key}>
                    {t(VARIABLE_LABEL_KEYS[key])} ({VARIABLE_UNITS[key]})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {avg != null && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto' }}>
                <Typography variant="caption" color="text.secondary">{t('avgWeather')}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: varColor }}>
                  {avg} {varUnit}
                </Typography>
              </Box>
            )}
          </Box>

          {chartData.length === 0 ? (
            <Typography color="text.secondary" variant="body2">
              {t('noDataForYear', { year: selectedYear })}
            </Typography>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} width={48} tickFormatter={v => `${v}${varUnit}`} />
                <Tooltip
                  contentStyle={{
                    fontSize: '0.75rem',
                    padding: '4px 8px',
                    lineHeight: 1.4,
                  }}
                  labelStyle={{
                    color: '#000',
                    fontWeight: 600,
                    marginBottom: 2,
                  }}
                  formatter={(v) => [`${v} ${varUnit}`, varLabel]}
                  labelFormatter={(label, payload) => {
                    const date = payload?.[0]?.payload?.date;
                    return date
                      ? new Date(date).toLocaleDateString(i18n.language === 'fi' ? 'fi-FI' : 'en-GB')
                      : label;
                  }}
                />
                {avg != null && (
                  <ReferenceLine
                    y={avg}
                    stroke={varColor}
                    strokeDasharray="4 2"
                    strokeOpacity={0.5}
                    label={{ value: `Ø ${avg}`, fontSize: 10, fill: varColor, position: 'right' }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={varColor}
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