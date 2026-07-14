import { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, IconButton, Chip,
  CircularProgress, Alert, Skeleton, Divider,
  Select, MenuItem, FormControl, InputLabel, Tooltip
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import FullscreenablePanel from '../shared/FullscreenablePanel';
import { useAppStore } from '../../store/appStore';
import NdviDatePicker from './NdviDatePicker';

import ThermostatIcon from '@mui/icons-material/Thermostat';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import GrassIcon from '@mui/icons-material/Grass';
import AirIcon from '@mui/icons-material/Air';
import OpacityIcon from '@mui/icons-material/Opacity'

// Lisää importtiin
import NdviTimelineChart from './NdviTimelineChart';

interface Props {
  fieldId: string;
  fieldName?: string;
}

const NDVI_COLOR_LABEL = (v: number) => {
  if (v >= 0.6) return { label: 'Erinomainen', color: '#2E7D32' };
  if (v >= 0.4) return { label: 'Hyvä', color: '#689F38' };
  if (v >= 0.2) return { label: 'Kohtalainen', color: '#F9A825' };
  return { label: 'Heikko', color: '#C62828' };
};

const fmt = (date: string) =>
  new Date(date).toLocaleDateString('fi-FI', { day: 'numeric', month: 'numeric', year: 'numeric' });

const getYear = (date: string) => new Date(date).getFullYear();


export default function NdviMapViewer({ fieldId }: Props) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [index, setIndex] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);

  const { ndviEntries, imagesLoading, imagesError, activeGeometryHash, weatherData } = useAppStore();

  const loading = imagesLoading && activeGeometryHash !== fieldId;
  const error = imagesError;

  const allEntries = activeGeometryHash === fieldId ? ndviEntries : [];

  const filteredImages = allEntries
    .filter(e => getYear(e.generationtime) === selectedYear)
    .sort((a, b) => new Date(a.generationtime).getTime() - new Date(b.generationtime).getTime());

  // Lasketaan suoraan — ei statea eikä memoa
  const selectedDate = filteredImages.length > 0
    ? new Date(filteredImages[index].generationtime)
    : null;

  // Vuodet allEntries muuttuessa
  useEffect(() => {
    if (allEntries.length === 0) return;
    const years = [...new Set(allEntries.map(e => getYear(e.generationtime)))].sort((a, b) => b - a);
    setAvailableYears(years);
    setSelectedYear(years[0]);
  }, [allEntries.length]);

  // Reset index uusimpaan kun vuosi tai data muuttuu
  useEffect(() => {
    setIndex(filteredImages.length > 0 ? filteredImages.length - 1 : 0);
  }, [selectedYear, allEntries.length]);

  const prev = () => setIndex(i => Math.max(0, i - 1));
  const next = () => setIndex(i => Math.min(filteredImages.length - 1, i + 1));

  // Näppäimistönavigointi
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [filteredImages.length]);

  // Swipe
  const handleTouchStart = (e: React.TouchEvent) => setTouchStartX(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (diff > 50) next();
    if (diff < -50) prev();
  };

  useEffect(() => { setImgLoaded(false); }, [index]);

  const handleDateChange = (date: Date | null) => {
    if (!date) return;
    const targetIdx = filteredImages.findIndex(
      e => new Date(e.generationtime).toDateString() === date.toDateString()
    );
    if (targetIdx !== -1) setIndex(targetIdx);
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!filteredImages.length) return <Alert severity="info">Ei kuvia saatavilla.</Alert>;

  const current = filteredImages[index];
  const imageDate = current.generationtime;
  const status = NDVI_COLOR_LABEL(current.stats.average);
  const isFirst = index === 0;
  const isLast = index === filteredImages.length - 1;
  const dataUrl = current.image?.image.dataUrl;
  const currentWeather = weatherData.find(w => w.sentinelid === current.sentinelid);

  console.log('scale:', current.image?.scale);

  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, height: { md: '100%' } }}>
      <FullscreenablePanel>
        {(isFullscreen) => (
          <Paper sx={{
            flex: { md: '1 1 65%' },
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            minHeight: { xs: 320, md: 0 },
            height: isFullscreen ? '100%' : 'auto',
            borderRadius: isFullscreen ? 0 : 2,
          }}>
            {/* Vuosivalitsin */}
            <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2 }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Vuosi</InputLabel>
                <Select
                  value={selectedYear}
                  label="Vuosi"
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                >
                  {availableYears.map(y => (
                    <MenuItem key={y} value={y}>{y}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <NdviDatePicker
                value={selectedDate}
                selectedYear={selectedYear}
                onChange={handleDateChange}
                availableDates={filteredImages.map(e => new Date(e.generationtime))}
              />
              <Typography variant="caption" color="text.secondary">
                {filteredImages.length} kuvaa
              </Typography>
            </Box>

            {/* Kuva-alue */}
            <Box
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              sx={{
                flex: 1,
                position: 'relative',
                bgcolor: 'background.paper',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                minHeight: 0,
                userSelect: 'none',
              }}
            >
              {!imgLoaded && (
                <Skeleton variant="rectangular" sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
              )}
              {dataUrl && (
                <Box
                  component="img"
                  src={dataUrl}
                  alt={`NDVI ${fmt(imageDate)}`}
                  onLoad={() => setImgLoaded(true)}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    opacity: imgLoaded ? 1 : 0,
                    transition: 'opacity 0.3s',
                    pointerEvents: 'none',
                    filter: 'blur(1px)',
                  }}
                />
              )}
              <Chip
                label={fmt(imageDate)}
                size="small"
                sx={{
                  position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
                  bgcolor: 'rgba(0,0,0,0.65)', color: '#fff', fontWeight: 600, backdropFilter: 'blur(4px)',
                  pointerEvents: 'none',
                }}
              />
            </Box>

            {/* Navigointipalkki */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5, borderTop: 1, borderColor: 'divider' }}>
              <IconButton onClick={prev} disabled={isFirst} size="small" aria-label="Edellinen">
                <ArrowBackIosNewIcon fontSize="small" />
              </IconButton>
              <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                {filteredImages.slice(Math.max(0, index - 10), index + 10).map((entry, i) => {
                  const realIdx = Math.max(0, index - 10) + i;
                  return (
                    <Box key={entry.sentinelid} onClick={() => setIndex(realIdx)} sx={{
                      width: realIdx === index ? 10 : 6,
                      height: realIdx === index ? 10 : 6,
                      borderRadius: '50%',
                      bgcolor: realIdx === index ? 'primary.main' : 'action.disabled',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }} />
                  );
                })}
              </Box>
              <IconButton onClick={next} disabled={isLast} size="small" aria-label="Seuraava">
                <ArrowForwardIosIcon fontSize="small" />
              </IconButton>
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', pb: 1 }}>
              {index + 1} / {filteredImages.length}
              {typeof selectedYear === 'number' ? ` · ${selectedYear}` : ''}
            </Typography>
            {/* NDVI aikasarja — stats-paneelin alaosa */}
            <NdviTimelineChart
              entries={filteredImages}
              selectedIndex={index}
              onSelect={setIndex}
            />
          </Paper>
        )}
      </FullscreenablePanel>

      {/* Stats-paneeli */}
      <Paper sx={{ flex: { md: '0 0 35%' }, p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>

        <Box>
          <Typography variant="caption" color="text.secondary">Tilanne</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: status.color }} />
            <Typography sx={{ fontWeight: 600 }}>{status.label}</Typography>
          </Box>
        </Box>
        <Divider />
        {[
          { label: 'Keskiarvo (Avg)', value: current.stats.average },
          { label: 'Maksimi (Max)', value: current.stats.max },
          { label: 'Minimi (Min)', value: current.stats.min },
          { label: 'Hajonta (Std)', value: current.stats.std },
        ].map(({ label, value }) => (
          <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">{label}</Typography>
            <Chip label={value?.toFixed(2) ?? '—'} size="small" sx={{ fontWeight: 700, minWidth: 56, justifyContent: 'center' }} />
          </Box>
        ))}
        <Divider />
        <Divider />

        {/* NDVI-luokkajakauma StackBar */}
        {current.image?.scale && current.image.scale.length > 0 && (
          <>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Kasvillisuusjakauma
              </Typography>
              {/* StackBar */}
              <Box sx={{ display: 'flex', height: 18, borderRadius: 1, overflow: 'hidden', width: '100%' }}>
                {current.image.scale.map((cls, i) => {
                  if (cls.amount < 0.5) return null;
                  return (
                    <Tooltip key={i} title={`${cls.amount.toFixed(1)}%`} arrow>
                      <Box sx={{
                        width: `${cls.amount}%`,
                        bgcolor: cls.color,
                        transition: 'width 0.4s ease',
                        cursor: 'default',
                      }} />
                    </Tooltip>
                  );
                })}
              </Box>
              {/* Legenda */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {current.image.scale.map((cls, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: cls.color, flexShrink: 0 }} />
                    <Typography variant="caption" color="text.secondary">
                      {cls.amount.toFixed(1)}%
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
            <Divider />
            {/* Säätiedot — valittu päivä */}
            {currentWeather && (
              <>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    Säätiedot
                  </Typography>
                  {[
                    { label: 'Keskilämpötila', value: currentWeather.temperature_2m_mean, unit: '°C', icon: <ThermostatIcon fontSize="small" /> },
                    { label: 'Lämpötila max', value: currentWeather.temperature_2m_max, unit: '°C', icon: <ThermostatIcon fontSize="small" sx={{ color: '#C62828' }} /> },
                    { label: 'Lämpötila min', value: currentWeather.temperature_2m_min, unit: '°C', icon: <ThermostatIcon fontSize="small" sx={{ color: '#1565C0' }} /> },
                    { label: 'Kosteus', value: currentWeather.relative_humidity_2m_mean, unit: '%', icon: <OpacityIcon fontSize="small" /> },
                    { label: 'Sademäärä', value: currentWeather.precipitation_sum, unit: 'mm', icon: <WaterDropIcon fontSize="small" /> },
                    { label: 'Tuulen nopeus', value: currentWeather.wind_speed_10m_mean, unit: 'm/s', icon: <AirIcon fontSize="small" /> },
                    { label: 'Auringonsäteily', value: currentWeather.shortwave_radiation_sum, unit: 'MJ/m²', icon: <WbSunnyIcon fontSize="small" /> },
                    { label: 'ET₀', value: currentWeather.et0_fao_evapotranspiration, unit: 'mm', icon: <GrassIcon fontSize="small" /> },
                  ].map(({ label, value, unit, icon }) => (
                    <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
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
                </Box>
                <Divider />
              </>
            )}
          </>
        )}

        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Navigointi
          </Typography>
          <Typography variant="caption" color="text.secondary">← → näppäimet · nuolipainikkeet · pyyhkäisy</Typography>
        </Box>
        <Box sx={{ mt: 'auto' }}>
          <Typography variant="caption" color="text.secondary">
            {filteredImages.length} kuvaa
            {typeof selectedYear === 'number' ? ` vuodelta ${selectedYear}` : ' saatavilla'}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}