import { useState, useEffect, useRef } from 'react';
import {
  Box, Paper, Typography, IconButton, Chip,
  CircularProgress, Alert, Skeleton,
  Select, MenuItem, FormControl, InputLabel, Tooltip,
  useTheme,
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import { useAppStore } from '../../store/appStore';
import NdviDatePicker from './NdviDatePicker';
import NdviViewPanel from './NdviViewPanel';

interface Props {
  fieldId: string;
  fieldName?: string;
  geometry?: { type: string; coordinates: unknown[] };
}

const fmt = (date: string) =>
  new Date(date).toLocaleDateString('fi-FI', {
    day: 'numeric', month: 'numeric', year: 'numeric',
  });

const getYear = (date: string) => new Date(date).getFullYear();

export default function NdviMapViewer({ fieldId, fieldName, geometry }: Props) {
  const theme = useTheme();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [index, setIndex] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { ndviEntries, imagesLoading, imagesError, activeGeometryHash } = useAppStore();

  const loading = imagesLoading && activeGeometryHash !== fieldId;
  const error = imagesError;
  const allEntries = activeGeometryHash === fieldId ? ndviEntries : [];

  const filteredImages = allEntries
    .filter(e => getYear(e.generationtime) === selectedYear)
    .sort((a, b) => new Date(a.generationtime).getTime() - new Date(b.generationtime).getTime());

  const selectedDate = filteredImages.length > 0
    ? new Date(filteredImages[index].generationtime)
    : null;

  useEffect(() => {
    if (allEntries.length === 0) return;
    const years = [...new Set(allEntries.map(e => getYear(e.generationtime)))].sort((a, b) => b - a);
    setAvailableYears(years);
    setSelectedYear(years[0]);
  }, [allEntries.length]);

  useEffect(() => {
    setIndex(filteredImages.length > 0 ? filteredImages.length - 1 : 0);
  }, [selectedYear, allEntries.length]);

  const prev = () => setIndex(i => Math.max(0, i - 1));
  const next = () => setIndex(i => Math.min(filteredImages.length - 1, i + 1));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [filteredImages.length]);

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

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
      <CircularProgress />
    </Box>
  );
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!filteredImages.length) return <Alert severity="info">Ei kuvia saatavilla.</Alert>;

  const current = filteredImages[index];
  const imageDate = current.generationtime;
  const isFirst = index === 0;
  const isLast = index === filteredImages.length - 1;
  const dataUrl = current.image?.image.dataUrl;

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: { xs: 'column', md: 'row' },
      gap: 2,
      height: { xs: 'auto', md: '100%' },
    }}>

      {/* ── Vasen: NDVI-kuvaviewer (img + swipe) ── */}
      <Paper
        sx={{
          ...(isFullscreen ? {
            position: 'fixed',
            inset: 0,
            zIndex: theme.zIndex.modal,
            borderRadius: 0,
          } : {
            flex: { md: '1 1 65%' },
            height: { xs: 'auto', md: '100%' },
            minHeight: { md: 0 },
          }),
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Toolbar */}
        <Box sx={{
          px: 2, py: 1,
          borderBottom: 1, borderColor: 'divider',
          display: 'flex', alignItems: 'center', gap: 1.5,
          flexWrap: 'wrap', flexShrink: 0,
        }}>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Vuosi</InputLabel>
            <Select
              value={selectedYear}
              label="Vuosi"
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {availableYears.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
            </Select>
          </FormControl>
          <NdviDatePicker
            value={selectedDate}
            selectedYear={selectedYear}
            onChange={handleDateChange}
            availableDates={filteredImages.map(e => new Date(e.generationtime))}
          />
          <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
            {filteredImages.length} kuvaa
          </Typography>
          <IconButton
            onClick={() => setIsFullscreen(v => !v)}
            size="small"
            sx={{ ml: 'auto' }}
            aria-label={isFullscreen ? 'Sulje koko ruutu' : 'Avaa koko ruutu'}
          >
            {isFullscreen ? <CloseFullscreenIcon fontSize="small" /> : <OpenInFullIcon fontSize="small" />}
          </IconButton>
        </Box>

        {/* Kuva-alue — swipe toimii koska ei Leaflet-karttaa tässä */}
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
            minHeight: { xs: 300, md: 0 },
            userSelect: 'none',
          }}
        >
          {!imgLoaded && (
            <Skeleton
              variant="rectangular"
              sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            />
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
              position: 'absolute', bottom: 12, left: '50%',
              transform: 'translateX(-50%)',
              bgcolor: 'rgba(0,0,0,0.65)', color: '#fff',
              fontWeight: 600, backdropFilter: 'blur(4px)',
              pointerEvents: 'none',
            }}
          />
        </Box>

        {/* Navigointipalkki */}
        <Box sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          px: 2, py: 1.5, borderTop: 1, borderColor: 'divider', flexShrink: 0,
        }}>
          <IconButton onClick={prev} disabled={isFirst} size="small" aria-label="Edellinen">
            <ArrowBackIosNewIcon fontSize="small" />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
            {filteredImages.slice(Math.max(0, index - 10), index + 10).map((entry, i) => {
              const realIdx = Math.max(0, index - 10) + i;
              const isActive = realIdx === index;
              return (
                <Box
                  key={entry.sentinelid}
                  onClick={() => setIndex(realIdx)}
                  role="button"
                  aria-label={`Kuva ${realIdx + 1}`}
                  sx={{
                    p: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', userSelect: 'none', WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <Box sx={{
                    width: isActive ? 10 : 6, height: isActive ? 10 : 6,
                    borderRadius: '50%',
                    bgcolor: isActive ? 'primary.main' : 'action.disabled',
                    transition: 'all 0.2s', flexShrink: 0,
                  }} />
                </Box>
              );
            })}
          </Box>
          <IconButton onClick={next} disabled={isLast} size="small" aria-label="Seuraava">
            <ArrowForwardIosIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Kasvillisuusjakauma */}
        {current.image?.scale && current.image.scale.length > 0 && (
          <Box sx={{ px: 2, py: 1, borderTop: 1, borderColor: 'divider', flexShrink: 0 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
              Kasvillisuusjakauma
            </Typography>
            <Box sx={{ display: 'flex', height: 14, borderRadius: 1, overflow: 'hidden', width: '100%' }}>
              {current.image.scale.map((cls, i) =>
                cls.amount < 0.5 ? null : (
                  <Tooltip key={i} title={`${cls.amount.toFixed(1)}%`} arrow>
                    <Box sx={{ width: `${cls.amount}%`, bgcolor: cls.color, transition: 'width 0.4s ease' }} />
                  </Tooltip>
                )
              )}
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.75 }}>
              {current.image.scale.map((cls, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: cls.color, flexShrink: 0 }} />
                  <Typography variant="caption" color="text.secondary">{cls.amount.toFixed(1)}%</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Paper>

      {/* ── Oikea: NdviViewPanel tabeineen ──
          height: eksplisiittisesti sekä xs että md jotta flex-lapset
          (OnMapTab, LocationTab) saavat height:'100%' oikein mobiilissa.
          Ilman xs-korkeutta Leaflet-tabit saavat height:0. */}
      {!isFullscreen && (
        <Box sx={{
          flex: { md: '0 0 35%' },
          height: { xs: 500, md: '100%' },
          minHeight: { md: 0 },
          display: 'flex',
          flexDirection: 'column',
        }}>
          <NdviViewPanel
            fieldId={fieldId}
            fieldName={fieldName}
            geometry={geometry}
            entry={current}
            entries={filteredImages}
            selectedIndex={index}
            onSelect={setIndex}
          />
        </Box>
      )}
    </Box>
  );
}