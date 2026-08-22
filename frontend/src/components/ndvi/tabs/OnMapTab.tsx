import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Alert, IconButton,
  Dialog, DialogTitle, DialogContent,
} from '@mui/material';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { MergedNdviEntry } from '../../../types';

interface Props {
  entry: MergedNdviEntry;
  entries: MergedNdviEntry[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

const fmt = (date: string) =>
  new Date(date).toLocaleDateString('fi-FI', { day: 'numeric', month: 'numeric', year: 'numeric' });

// Erillinen karttakomponentti — voidaan mountata sekä normaaliin että dialogiin
//function NdviMap({ entry }: { entry: MergedNdviEntry }) {
function NdviMap({ entry, padding = [20, 20], zoomOut = 0 }: { 
  entry: MergedNdviEntry;
  padding?: [number, number];
  zoomOut?: number;
}){
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<L.Map | null>(null);
  const overlayRef = useRef<L.ImageOverlay | null>(null);
  const mapInitialized = useRef(false);

  const image = entry.image;

  useEffect(() => {
    if (!image || mapInitialized.current) return;
    const raf = requestAnimationFrame(() => {
      if (!mapRef.current || mapInitialized.current) return;
      mapInitialized.current = true;

      const bounds: L.LatLngBoundsExpression = [
        [image.image.minY, image.image.minX],
        [image.image.maxY, image.image.maxX],
      ];

      const map = L.map(mapRef.current, { zoomControl: true, attributionControl: true });
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { attribution: 'Tiles &copy; Esri', maxZoom: 19 }
      ).addTo(map);

      overlayRef.current = L.imageOverlay(image.image.dataUrl, bounds, {
        opacity: 0.85,
        interactive: false,
      }).addTo(map);

      map.fitBounds(bounds, { padding });
      if (zoomOut > 0) map.zoomOut(zoomOut);
      leafletRef.current = map;
    });

    return () => {
      cancelAnimationFrame(raf);
      leafletRef.current?.remove();
      leafletRef.current = null;
      overlayRef.current = null;
      mapInitialized.current = false;
    };
  }, []);

  useEffect(() => {
    if (!leafletRef.current || !image) return;
    const bounds = L.latLngBounds([
      [image.image.minY, image.image.minX],
      [image.image.maxY, image.image.maxX],
    ]);
    if (overlayRef.current) {
      overlayRef.current.setUrl(image.image.dataUrl);
      overlayRef.current.setBounds(bounds);
    }
  }, [entry.sentinelid]);

  return (
    <Box
      ref={mapRef}
      sx={{ height: '100%', width: '100%', '& .leaflet-container': { height: '100%' } }}
    />
  );
}

export default function OnMapTab({ entry }: Props) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const image = entry.image;

  if (!image) {
    return <Alert severity="info" sx={{ m: 2 }}>{t('noMapData')}</Alert>;
  }

  return (
    <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="caption" color="text.secondary">
          {t('ndviOnMap')} — {fmt(entry.generationtime)}
        </Typography>
        <IconButton size="small" onClick={() => setExpanded(true)}>
          <OpenInFullIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Normaali kartta */}
      <Box sx={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <NdviMap entry={entry} />
      </Box>

      {/* Laajennettu dialogi */}
      <Dialog
        open={expanded}
        onClose={() => setExpanded(false)}
        maxWidth="xl"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            height: 'calc(100vh - 64px)',
            maxHeight: 'calc(100vh - 64px)',
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 0 }}>
          <Typography variant="subtitle1">
            {t('ndviOnMap')} — {fmt(entry.generationtime)}
          </Typography>
          <IconButton size="small" onClick={() => setExpanded(false)}>
            <CloseFullscreenIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', p: 1 }}>
          <Box sx={{ flex: 1, minHeight: 0 }}>
            {/* key pakottaa remountin kun dialogi avataan */}            
            <NdviMap key={expanded ? 'expanded' : 'normal'} entry={entry} zoomOut={2} />
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}