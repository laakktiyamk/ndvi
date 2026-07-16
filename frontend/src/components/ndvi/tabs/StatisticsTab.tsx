import {
  Box, Typography, Chip, Divider, Tooltip,
} from '@mui/material';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import GrassIcon from '@mui/icons-material/Grass';
import AirIcon from '@mui/icons-material/Air';
import OpacityIcon from '@mui/icons-material/Opacity';
import type { MergedNdviEntry, IWeather } from '../../../types';

interface Props {
  entry: MergedNdviEntry;
  weather: IWeather | undefined;
}

const NDVI_COLOR_LABEL = (v: number) => {
  if (v >= 0.6) return { label: 'Erinomainen', color: '#2E7D32' };
  if (v >= 0.4) return { label: 'Hyvä', color: '#689F38' };
  if (v >= 0.2) return { label: 'Kohtalainen', color: '#F9A825' };
  return { label: 'Heikko', color: '#C62828' };
};

export default function StatisticsTab({ entry, weather }: Props) {
  const status = NDVI_COLOR_LABEL(entry.stats.average);
  const image = entry.image;

  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5, overflow: 'auto', height: '100%' }}>

      {/* Tilanne */}
      <Box>
        <Typography variant="caption" color="text.secondary">Tilanne</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: status.color }} />
          <Typography sx={{ fontWeight: 600 }}>{status.label}</Typography>
        </Box>
      </Box>
      <Divider />

      {/* NDVI-arvot */}
      {[
        { label: 'Keskiarvo (Avg)', value: entry.stats.average },
        { label: 'Maksimi (Max)', value: entry.stats.max },
        { label: 'Minimi (Min)', value: entry.stats.min },
        { label: 'Hajonta (Std)', value: entry.stats.std },
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

      {/* Kasvillisuusjakauma */}
      {image?.scale && image.scale.length > 0 && (
        <>
          <Divider />
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Kasvillisuusjakauma
            </Typography>
            <Box sx={{ display: 'flex', height: 18, borderRadius: 1, overflow: 'hidden', width: '100%' }}>
              {image.scale.map((cls, i) =>
                cls.amount < 0.5 ? null : (
                  <Tooltip key={i} title={`${cls.amount.toFixed(1)}%`} arrow>
                    <Box sx={{
                      width: `${cls.amount}%`,
                      bgcolor: cls.color,
                      transition: 'width 0.4s ease',
                      cursor: 'default',
                    }} />
                  </Tooltip>
                )
              )}
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              {image.scale.map((cls, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: cls.color, flexShrink: 0 }} />
                  <Typography variant="caption" color="text.secondary">
                    {cls.amount.toFixed(1)}%
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </>
      )}

      {/* Säätiedot */}
      {weather && (
        <>
          <Divider />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            Säätiedot
          </Typography>
          {[
            { label: 'Keskilämpötila',   value: weather.temperature_2m_mean,        unit: '°C',    icon: <ThermostatIcon fontSize="small" /> },
            { label: 'Lämpötila max',    value: weather.temperature_2m_max,         unit: '°C',    icon: <ThermostatIcon fontSize="small" sx={{ color: '#C62828' }} /> },
            { label: 'Lämpötila min',    value: weather.temperature_2m_min,         unit: '°C',    icon: <ThermostatIcon fontSize="small" sx={{ color: '#1565C0' }} /> },
            { label: 'Kosteus',          value: weather.relative_humidity_2m_mean,  unit: '%',     icon: <OpacityIcon fontSize="small" /> },
            { label: 'Sademäärä',        value: weather.precipitation_sum,          unit: 'mm',    icon: <WaterDropIcon fontSize="small" /> },
            { label: 'Tuulen nopeus',    value: weather.wind_speed_10m_mean,        unit: 'm/s',   icon: <AirIcon fontSize="small" /> },
            { label: 'Auringonsäteily',  value: weather.shortwave_radiation_sum,    unit: 'MJ/m²', icon: <WbSunnyIcon fontSize="small" /> },
            { label: 'ET₀',             value: weather.et0_fao_evapotranspiration, unit: 'mm',    icon: <GrassIcon fontSize="small" /> },
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
