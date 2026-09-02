import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Grid, CircularProgress, useTheme,
} from '@mui/material';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

interface WeatherEntry {
  date: string;
  temperature_2m_max: number | null;
  temperature_2m_min: number | null;
  precipitation_sum: number | null;
}

interface WeatherSummaryPanelProps {
  weatherData: WeatherEntry[];
  weatherLoading: boolean;
  year?: number;
}

const fmtShort = (iso: string, lang = 'fi'): string => {
  const d = new Date(iso);
  return lang === 'fi'
    ? `${d.getDate()}.${d.getMonth() + 1}.`
    : `${d.getMonth() + 1}/${d.getDate()}`;
};

const calcGDD = (tMax: number | null, tMin: number | null): number => {
  if (tMax == null || tMin == null) return 0;
  return Math.max(0, (tMax + tMin) / 2 - 5);
};

export default function WeatherSummaryPanel({
  weatherData,
  weatherLoading,
  year = new Date().getFullYear(),
}: WeatherSummaryPanelProps) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();

  const [lang, setLang] = useState(i18n.language);

  useEffect(() => {
    const handler = (lng: string) => setLang(lng);
    i18n.on('languageChanged', handler);
    return () => i18n.off('languageChanged', handler);
  }, [i18n]);

  const seasonStart = new Date(year, 4, 1);
  const weatherThisYear = weatherData
    .filter(w => {
      const d = new Date(w.date);
      return d.getFullYear() === year && d >= seasonStart;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let cumGDD = 0, cumRain = 0;
  const cumulativeData = weatherThisYear.map(w => {
    cumGDD += calcGDD(w.temperature_2m_max, w.temperature_2m_min);
    cumRain += w.precipitation_sum ?? 0;
    return {
      date: w.date,
      gdd: Math.round(cumGDD),
      rain: Math.round(cumRain * 10) / 10,
    };
  });

  const lastEntry = cumulativeData[cumulativeData.length - 1];

  if (weatherLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (cumulativeData.length === 0) {
    return (
      <Typography color="text.secondary" variant="body2">
        {t('noWeatherData')}
      </Typography>
    );
  }

  return (
    <>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 6 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <ThermostatIcon fontSize="small" sx={{ color: '#C62828' }} />
            <Box>
              <Typography variant="caption" color="text.secondary">{t('heatSum')}</Typography>
              <Typography sx={{ fontWeight: 700 }}>{lastEntry?.gdd ?? 0} {t('gddUnit')}</Typography>
            </Box>
          </Box>
        </Grid>
        <Grid size={{ xs: 6 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <WaterDropIcon fontSize="small" sx={{ color: '#1565C0' }} />
            <Box>
              <Typography variant="caption" color="text.secondary">{t('totalRain')}</Typography>
              <Typography sx={{ fontWeight: 700 }}>{lastEntry?.rain ?? 0} mm</Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={cumulativeData} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: theme.palette.text.secondary }}
            tickFormatter={(date) => fmtShort(date, lang)}
            interval="preserveStartEnd"
          />
          <YAxis
            yAxisId="gdd"
            tick={{ fontSize: 10, fill: theme.palette.text.secondary }}
            width={40}
            tickFormatter={v => `${v}°`}
          />
          <YAxis
            yAxisId="rain"
            orientation="right"
            tick={{ fontSize: 10, fill: theme.palette.text.secondary }}
            width={36}
            tickFormatter={v => `${v}mm`}
          />
          <Tooltip
            contentStyle={{
              fontSize: '0.75rem',
              padding: '4px 8px',
              lineHeight: 1.4,
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              color: theme.palette.text.primary,
            }}
            labelStyle={{ fontWeight: 600, marginBottom: 2, color: theme.palette.text.primary }}
            itemStyle={{ color: theme.palette.text.primary }}
            labelFormatter={(date) => fmtShort(date as string, lang)}
            formatter={(v, name) =>
              name === 'gdd'
                ? [`${v} ${t('gddUnit')}`, t('heatSum')]
                : [`${v} mm`, t('totalRain')]
            }
          />
          <Legend formatter={v => v === 'gdd' ? t('heatSum') : t('totalRain')} />
          <Line yAxisId="gdd" type="monotone" dataKey="gdd" stroke="#C62828" strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line yAxisId="rain" type="monotone" dataKey="rain" stroke="#1565C0" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </>
  );
}