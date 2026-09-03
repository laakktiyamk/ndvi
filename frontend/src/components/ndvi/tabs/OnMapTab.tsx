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
import type { MergedNdviEntry, ICropParcel } from '../../../types';
import { getFieldColorMap } from '../CropFieldsOverlay';

interface Props {
  entry: MergedNdviEntry;
  entries: MergedNdviEntry[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  // Kasvulohkot — valinnaisia, koska paneelia käytetään myös ilman niitä
  cropParcels?: ICropParcel[];
  selectedTunnus?: string | null;
  onSelectField?: (tunnus: string | null) => void;
}

const fmt = (date: string) =>
  new Date(date).toLocaleDateString('fi-FI', { day: 'numeric', month: 'numeric', year: 'numeric' });

// Erillinen karttakomponentti — voidaan mountata sekä normaaliin että dialogiin
function NdviMap({
  entry, padding = [20, 20], zoomOut = 0,
  cropParcels = [], selectedTunnus = null, onSelectField,
}: {
  entry: MergedNdviEntry;
  padding?: [number, number];
  zoomOut?: number;
  cropParcels?: ICropParcel[];
  selectedTunnus?: string | null;
  onSelectField?: (tunnus: string | null) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<L.Map | null>(null);
  const overlayRef = useRef<L.ImageOverlay | null>(null);
  const cropLayerRef = useRef<L.GeoJSON | null>(null);
  const mapInitialized = useRef(false);
  const [mapReady, setMapReady] = useState(false);

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
      setMapReady(true);
    });

    return () => {
      cancelAnimationFrame(raf);
      leafletRef.current?.remove();
      leafletRef.current = null;
      overlayRef.current = null;
      cropLayerRef.current = null;
      mapInitialized.current = false;
      setMapReady(false);
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

  // ── Kasvulohkot GeoJSON-layerina, väritys ja korostus synkassa
  //    NdviMapViewerin SVG-overlayn (kuvanäkymä) kanssa ──
  useEffect(() => {
    const map = leafletRef.current;
    if (!map) return;

    if (cropLayerRef.current) {
      cropLayerRef.current.remove();
      cropLayerRef.current = null;
    }

    if (cropParcels.length === 0) return;

    const fieldColors = getFieldColorMap(cropParcels);

    const featureCollection = {
      type: 'FeatureCollection' as const,
      features: cropParcels.map((p) => ({
        type: 'Feature' as const,
        properties: { tunnus: p.tunnus },
        geometry: p.geometry,
      })),
    };

    const layer = L.geoJSON(featureCollection, {
      style: (feature) => {
        const tunnus = feature!.properties.tunnus as string;
        const isSelected = tunnus === selectedTunnus;
        return {
          color: fieldColors[tunnus],
          weight: isSelected ? 3 : 1.5,
          fillOpacity: isSelected ? 0.35 : 0,
          dashArray: isSelected ? undefined : '5 3',
        };
      },
      onEachFeature: (feature, lyr) => {
        lyr.on('click', () => {
          const tunnus = feature.properties.tunnus as string;
          onSelectField?.(tunnus === selectedTunnus ? null : tunnus);
        });
      },
    }).addTo(map);

    cropLayerRef.current = layer;
  }, [cropParcels, selectedTunnus, onSelectField, mapReady]);

  return (
    <Box
      ref={mapRef}
      sx={{ height: '100%', width: '100%', '& .leaflet-container': { height: '100%' } }}
    />
  );
}

export default function OnMapTab({
  entry, cropParcels = [], selectedTunnus = null, onSelectField,
}: Props) {
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
        <NdviMap
          entry={entry}
          cropParcels={cropParcels}
          selectedTunnus={selectedTunnus}
          onSelectField={onSelectField}
        />
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
            <NdviMap
              key={expanded ? 'expanded' : 'normal'}
              entry={entry}
              zoomOut={2}
              cropParcels={cropParcels}
              selectedTunnus={selectedTunnus}
              onSelectField={onSelectField}
            />
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}