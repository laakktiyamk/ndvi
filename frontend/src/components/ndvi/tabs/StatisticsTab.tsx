import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Chip, Divider,
} from '@mui/material';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import GrassIcon from '@mui/icons-material/Grass';
import AirIcon from '@mui/icons-material/Air';
import OpacityIcon from '@mui/icons-material/Opacity';
import type { MergedNdviEntry, IWeather } from '../../../types';
import { getNdviStatus } from '../../../utils/ndviStatus';

interface Props {
  entry: MergedNdviEntry;
  weather: IWeather | undefined;
}

export default function StatisticsTab({ entry, weather }: Props) {
  const { t } = useTranslation();
  const status = getNdviStatus(entry.stats.average, t);

  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5, overflow: 'auto', height: '100%' }}>

      <Box>
        <Typography variant="caption" color="text.secondary">{t('status')}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: status.color }} />
          <Typography sx={{ fontWeight: 600 }}>{status.label}</Typography>
        </Box>
      </Box>
      <Divider />

      {[
        { label: t('ndviAvg'), value: entry.stats.average },
        { label: t('ndviMax'), value: entry.stats.max },
        { label: t('ndviMin'), value: entry.stats.min },
        { label: t('ndviStd'), value: entry.stats.std },
      ].map(({ label, value }) => (
        <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">{label}</Typography>
          <Chip
            label={value?.toFixed(2) ?? '—'}
            size="small"
            sx={{ fontWeight: 700, minWidth: 56, justifyContent: 'center' }}
          />
        </Box>
      ))}

      {weather && (
        <>
          <Divider />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            {t('weatherData')}
          </Typography>
          {[
            { label: t('avgTemp'),       value: weather.temperature_2m_mean,        unit: '°C',    icon: <ThermostatIcon fontSize="small" /> },
            { label: t('maxTemp'),       value: weather.temperature_2m_max,         unit: '°C',    icon: <ThermostatIcon fontSize="small" sx={{ color: '#C62828' }} /> },
            { label: t('minTemp'),       value: weather.temperature_2m_min,         unit: '°C',    icon: <ThermostatIcon fontSize="small" sx={{ color: '#1565C0' }} /> },
            { label: t('humidity'),      value: weather.relative_humidity_2m_mean,  unit: '%',     icon: <OpacityIcon fontSize="small" /> },
            { label: t('precipitation'), value: weather.precipitation_sum,          unit: 'mm',    icon: <WaterDropIcon fontSize="small" /> },
            { label: t('maxWind'),       value: weather.wind_speed_10m_mean,        unit: 'm/s',   icon: <AirIcon fontSize="small" /> },
            { label: t('radiation'),     value: weather.shortwave_radiation_sum,    unit: 'MJ/m²', icon: <WbSunnyIcon fontSize="small" /> },
            { label: t('et0'),           value: weather.et0_fao_evapotranspiration, unit: 'mm',    icon: <GrassIcon fontSize="small" /> },
          ].map(({ label, value, unit, icon }) => (
            <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.25 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: 'text.secondary' }}>
                {icon}
                <Typography variant="body2" color="text.secondary">{label}</Typography>
              </Box>
              <Chip
                label={value != null ? `${Number(value).toFixed(1)} ${unit}` : '—'}
                size="small"
                sx={{ fontWeight: 600, minWidth: 72, justifyContent: 'center' }}
              />
            </Box>
          ))}
        </>
      )}
    </Box>
  );
}