import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, IconButton, Chip, Paper,
  CircularProgress, Alert, Skeleton, Divider, Grid,
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { fetchAllImages } from '../../services/ndviService';
import type { NdviImage } from '../../types';

interface Props {
  sentinelid: string;
  fieldName?: string;
}

const NDVI_STATUS = (v: number) => {
  if (v >= 0.6) return { label: 'Erinomainen', color: '#2E7D32' };
  if (v >= 0.4) return { label: 'Hyvä',        color: '#689F38' };
  if (v >= 0.2) return { label: 'Kohtalainen', color: '#F9A825' };
  return              { label: 'Heikko',        color: '#C62828' };
};

const fmt = (date: string) =>
  new Date(date).toLocaleDateString('fi-FI', { day: 'numeric', month: 'numeric', year: 'numeric' });

const STAT_ROWS = (img: NdviImage) => [
  { label: 'Keskiarvo (Avg)', value: img.ndviMean },
  { label: 'Maksimi (Max)',   value: img.ndviMax  },
  { label: 'Minimi (Min)',    value: img.ndviMin  },
  { label: 'Hajonta (Std)',   value: img.ndviStd  },
];

export default function NdviMapViewerC({ sentinelid, fieldName }: Props) {
  const [images, setImages]       = useState<NdviImage[]>([]);
  const [index, setIndex]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAllImages(sentinelid);
      const data = res.data;
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

  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  const next = useCallback(() => setIndex((i) => Math.min(images.length - 1, i + 1)), [images.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prev, next]);

  useEffect(() => { setImgLoaded(false); }, [index]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  if (error)   return <Alert severity="error">{error}</Alert>;
  if (!images.length) return <Alert severity="info">Ei kuvia saatavilla.</Alert>;

  const current = images[index];
  const status  = NDVI_STATUS(current.ndviMean);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>

      {/* ── Karttakuva koko leveydeltä ── */}
      <Paper sx={{ position: 'relative', bgcolor: '#111', borderRadius: 2, overflow: 'hidden', aspectRatio: { xs: '4/3', md: '16/7' } }}>
        {!imgLoaded && (
          <Skeleton variant="rectangular" sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
        )}
        <Box
          component="img"
          src={current.image.dataUrl}
          alt={`NDVI ${fmt(current.date)}`}
          onLoad={() => setImgLoaded(true)}
          sx={{
            width: '100%', height: '100%',
            objectFit: 'contain',
            opacity: imgLoaded ? 1 : 0,
            transition: 'opacity 0.3s',
          }}
        />
        {/* Päivämäärä + lohkon nimi overlayssa */}
        <Box sx={{
          position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: 1, alignItems: 'center',
        }}>
          {fieldName && (
            <Chip label={fieldName} size="small"
              sx={{ bgcolor: 'rgba(0,0,0,0.65)', color: 'white', backdropFilter: 'blur(4px)', fontWeight: 600 }} />
          )}
          <Chip label={fmt(current.date)} size="small"
            sx={{ bgcolor: 'rgba(0,0,0,0.65)', color: 'white', backdropFilter: 'blur(4px)' }} />
        </Box>
      </Paper>

      {/* ── Navigointipalkki ── */}
      <Paper sx={{ px: 3, py: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={prev} disabled={index === 0} size="small" aria-label="Edellinen">
          <ArrowBackIosNewIcon fontSize="small" />
        </IconButton>

        <Box sx={{ flex: 1, display: 'flex', gap: 0.5, justifyContent: 'center', flexWrap: 'wrap' }}>
          {images.slice(Math.max(0, index - 12), index + 12).map((img, i) => {
            const realIdx = Math.max(0, index - 12) + i;
            return (
              <Box key={img._id} onClick={() => setIndex(realIdx)} sx={{
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

        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
          {index + 1} / {images.length}
        </Typography>

        <IconButton onClick={next} disabled={index === images.length - 1} size="small" aria-label="Seuraava">
          <ArrowForwardIosIcon fontSize="small" />
        </IconButton>
      </Paper>

      {/* ── Stats kortteina ── */}
      <Grid container spacing={2}>
        {/* Tila-kortti */}
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="caption" color="text.secondary">Tilanne</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: status.color }} />
              <Typography fontWeight={700} variant="h6">{status.label}</Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              ← → näppäimet
            </Typography>
          </Paper>
        </Grid>

        {/* Numerokortit */}
        {STAT_ROWS(current).map(({ label, value }) => (
          <Grid item xs={6} sm={2} key={label}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" display="block">
                {label}
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Typography variant="h5" fontWeight={700} color="primary">
                {value?.toFixed(2) ?? '—'}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
