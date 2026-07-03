import { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, IconButton, Chip,
  CircularProgress, Alert, Skeleton, Divider,
  Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import FullscreenablePanel from '../shared/FullscreenablePanel';
import { fetchAllImages } from '../../services/ndviService';
import type { NdviImage } from '../../types';

interface Props {
  sentinelid: string;
  fieldName?: string;
}

const NDVI_COLOR_LABEL = (v: number) => {
  if (v >= 0.6) return { label: 'Erinomainen', color: '#2E7D32' };
  if (v >= 0.4) return { label: 'Hyvä',        color: '#689F38' };
  if (v >= 0.2) return { label: 'Kohtalainen', color: '#F9A825' };
  return              { label: 'Heikko',        color: '#C62828' };
};

const fmt = (date: string) =>
  new Date(date).toLocaleDateString('fi-FI', { day: 'numeric', month: 'numeric', year: 'numeric' });

const getYear = (date: string) => new Date(date).getFullYear();

export default function NdviMapViewer({ sentinelid, fieldName }: Props) {
  const [allImages, setAllImages]           = useState<NdviImage[]>([]);
  const [images, setImages]                 = useState<NdviImage[]>([]);
  const [selectedYear, setSelectedYear]     = useState<number | 'all'>('all');
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [index, setIndex]                   = useState(0);
  const [loading, setLoading]               = useState(true);
  const [imgLoaded, setImgLoaded]           = useState(false);
  const [error, setError]                   = useState<string | null>(null);
  const [touchStartX, setTouchStartX]       = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchAllImages(sentinelid);
        const data = res.data.sort(
          (a, b) => new Date(a.id.split('_')[0]).getTime() - new Date(b.id.split('_')[0]).getTime()
        );
        setAllImages(data);
        const years = [...new Set(data.map((img) => getYear(img.id.split('_')[0])))].sort();
        setAvailableYears(years);
        setImages(data);
        setIndex(data.length - 1);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Haku epäonnistui');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [sentinelid]);

  // Suodata vuoden mukaan
  useEffect(() => {
    const filtered = selectedYear === 'all'
      ? allImages
      : allImages.filter((img) => getYear(img.id.split('_')[0]) === selectedYear);
    setImages(filtered);
    setIndex(filtered.length - 1);
  }, [selectedYear, allImages]);

  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  const next = useCallback(() => setIndex((i) => Math.min(images.length - 1, i + 1)), [images.length]);

  // Näppäimistönavigointi
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prev, next]);

  // Swipe-navigointi
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (diff > 50)  next();   // pyyhkäisy vasemmalle → seuraava
    if (diff < -50) prev();   // pyyhkäisy oikealle → edellinen
  };

  useEffect(() => { setImgLoaded(false); }, [index]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  if (error)   return <Alert severity="error">{error}</Alert>;
  if (!images.length) return <Alert severity="info">Ei kuvia saatavilla.</Alert>;

  const current   = images[index];
  const imageDate = current.id.split('_')[0];
  const status    = NDVI_COLOR_LABEL(current.average);
  const isFirst   = index === 0;
  const isLast    = index === images.length - 1;

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

            {/* Vuosivalitsin — dropdown, skaalautuu rajattomasti */}
            <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2 }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Vuosi</InputLabel>
                <Select
                  value={selectedYear}
                  label="Vuosi"
                  onChange={(e) => setSelectedYear(e.target.value as number | 'all')}
                >
                  <MenuItem value="all">Kaikki</MenuItem>
                  {availableYears.map((y) => (
                    <MenuItem key={y} value={y}>{y}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography variant="caption" color="text.secondary">
                {images.length} kuvaa
              </Typography>
            </Box>

            {/* Kuva-alue + swipe */}
            <Box
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              sx={{
                flex: 1,
                position: 'relative',
                bgcolor: '#111',
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
              <Box
                component="img"
                src={current.image.dataUrl}
                alt={`NDVI ${fmt(imageDate)}`}
                onLoad={() => setImgLoaded(true)}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  opacity: imgLoaded ? 1 : 0,
                  transition: 'opacity 0.3s',
                  pointerEvents: 'none',   // ← ei häiritse swipeä
                }}
              />
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
                {images.slice(Math.max(0, index - 10), index + 10).map((img, i) => {
                  const realIdx = Math.max(0, index - 10) + i;
                  return (
                    <Box key={img.id} onClick={() => setIndex(realIdx)} sx={{
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

            <Typography variant="caption" color="text.secondary" textAlign="center" pb={1}>
              {index + 1} / {images.length} {selectedYear !== 'all' ? `· ${selectedYear}` : ''}
            </Typography>
          </Paper>
        )}
      </FullscreenablePanel>

      {/* ─── Oikea: stats-paneeli ─── */}
      <Paper sx={{ flex: { md: '0 0 35%' }, p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {fieldName && (
          <>
            <Typography variant="h6" fontWeight={700}>{fieldName}</Typography>
            <Divider />
          </>
        )}

        <Box>
          <Typography variant="caption" color="text.secondary">Tilanne</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: status.color }} />
            <Typography fontWeight={600}>{status.label}</Typography>
          </Box>
        </Box>

        <Divider />

        {[
          { label: 'Keskiarvo (Avg)', value: current.average },
          { label: 'Maksimi (Max)',   value: current.max },
          { label: 'Minimi (Min)',    value: current.min },
          { label: 'Hajonta (Std)',   value: current.std },
        ].map(({ label, value }) => (
          <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">{label}</Typography>
            <Chip label={value?.toFixed(2) ?? '—'} size="small" sx={{ fontWeight: 700, minWidth: 56, justifyContent: 'center' }} />
          </Box>
        ))}

        <Divider />

        <Box>
          <Typography variant="caption" color="text.secondary" display="block" mb={1}>Navigointi</Typography>
          <Typography variant="caption" color="text.secondary">← → näppäimet · nuolipainikkeet · pyyhkäisy</Typography>
        </Box>

        <Box sx={{ mt: 'auto' }}>
          <Typography variant="caption" color="text.secondary">
            {images.length} kuvaa{selectedYear !== 'all' ? ` vuodelta ${selectedYear}` : ' saatavilla'}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
