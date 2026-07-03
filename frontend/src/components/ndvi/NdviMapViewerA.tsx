import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, IconButton, Chip,
  CircularProgress, Alert, Skeleton, Paper,
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

export default function NdviMapViewerA({ sentinelid, fieldName }: Props) {

  console.log('NdviMapViewer mounttautui, sentinelid:', sentinelid);

  const [images, setImages]       = useState<NdviImage[]>([]);
  const [index, setIndex]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [statsOpen, setStatsOpen] = useState(true);

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
    <Box sx={{ position: 'relative', width: '100%', height: '100%', bgcolor: '#0a0a0a', borderRadius: 2, overflow: 'hidden' }}>

      {/* ── Koko ruudun kuva ── */}
      {!imgLoaded && <Skeleton variant="rectangular" sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', bgcolor: '#1a1a1a' }} />}
      <Box
        component="img"
        src={current.image.dataUrl}
        alt={`NDVI ${fmt(current.date)}`}
        onLoad={() => setImgLoaded(true)}
        sx={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          opacity: imgLoaded ? 1 : 0,
          transition: 'opacity 0.4s',
        }}
      />

      {/* ── Yläpalkki: lohkon nimi ── */}
      {fieldName && (
        <Box sx={{
          position: 'absolute', top: 16, left: 16,
          bgcolor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
          borderRadius: 2, px: 2, py: 1,
        }}>
          <Typography color="white" fontWeight={700} variant="body2">{fieldName}</Typography>
        </Box>
      )}

      {/* ── Stats overlay (oikea yläkulma) ── */}
      <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
        <Paper
          elevation={0}
          sx={{
            bgcolor: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(8px)',
            borderRadius: 2,
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.1)',
            minWidth: 140,
            cursor: 'pointer',
          }}
          onClick={() => setStatsOpen((o) => !o)}
        >
          <Box sx={{ px: 2, py: 1, borderBottom: statsOpen ? '1px solid rgba(255,255,255,0.1)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: status.color, mr: 1, display: 'inline-block' }} />
            <Typography color="white" variant="caption" fontWeight={700}>{status.label}</Typography>
            <Typography color="rgba(255,255,255,0.4)" variant="caption" sx={{ ml: 1 }}>{statsOpen ? '▲' : '▼'}</Typography>
          </Box>
          {statsOpen && (
            <Box sx={{ px: 2, py: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[
                { label: 'Avg', value: current.ndviMean },
                { label: 'Max', value: current.ndviMax  },
                { label: 'Min', value: current.ndviMin  },
                { label: 'Std', value: current.ndviStd  },
              ].map(({ label, value }) => (
                <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                  <Typography color="rgba(255,255,255,0.55)" variant="caption">{label}</Typography>
                  <Chip
                    label={value?.toFixed(2) ?? '—'}
                    size="small"
                    sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: 'white', fontWeight: 700, height: 22, fontSize: 11 }}
                  />
                </Box>
              ))}
            </Box>
          )}
        </Paper>
      </Box>

      {/* ── Alanavi: nuolet + pisteet + päivämäärä ── */}
      <Box sx={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'linear-gradient(transparent, rgba(0,0,0,0.75))',
        px: 3, pt: 4, pb: 2,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5,
      }}>
        <Chip
          label={fmt(current.date)}
          size="small"
          sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 600, backdropFilter: 'blur(4px)' }}
        />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', justifyContent: 'center' }}>
          <IconButton onClick={prev} disabled={index === 0} size="small"
            sx={{ color: 'white', '&.Mui-disabled': { color: 'rgba(255,255,255,0.2)' } }}>
            <ArrowBackIosNewIcon fontSize="small" />
          </IconButton>

          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
            {images.slice(Math.max(0, index - 10), index + 10).map((img, i) => {
              const realIdx = Math.max(0, index - 10) + i;
              return (
                <Box key={img._id} onClick={() => setIndex(realIdx)} sx={{
                  width: realIdx === index ? 10 : 6,
                  height: realIdx === index ? 10 : 6,
                  borderRadius: '50%',
                  bgcolor: realIdx === index ? 'white' : 'rgba(255,255,255,0.35)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }} />
              );
            })}
          </Box>

          <IconButton onClick={next} disabled={index === images.length - 1} size="small"
            sx={{ color: 'white', '&.Mui-disabled': { color: 'rgba(255,255,255,0.2)' } }}>
            <ArrowForwardIosIcon fontSize="small" />
          </IconButton>
        </Box>

        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
          {index + 1} / {images.length} · ← → näppäimet
        </Typography>
      </Box>
    </Box>
  );
}
