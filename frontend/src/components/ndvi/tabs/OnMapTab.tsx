import { useEffect, useRef } from 'react';
import { Box, Typography, Alert } from '@mui/material';
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

export default function OnMapTab({ entry, entries, selectedIndex, onSelect }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<L.Map | null>(null);
  const overlayRef = useRef<L.ImageOverlay | null>(null);
  const mapInitialized = useRef(false);

  const image = entry.image;

  // Alustus rAF:lla — varmistaa että DOM-elementillä on oikea koko
  // ennen Leaflet-initia. Ilman tätä Leaflet saa height:0 flex-kontainerissa.
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

      map.fitBounds(bounds, { padding: [20, 20] });
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

  // Päivitä overlay kun entry vaihtuu
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

  if (!image) {
    return <Alert severity="info" sx={{ m: 2 }}>Tälle päivälle ei ole kuvaoverlaylle tarvittavia tietoja.</Alert>;
  }

  const isFirst = selectedIndex === 0;
  const isLast = selectedIndex === entries.length - 1;

  return (
    <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
        <Typography variant="caption" color="text.secondary">
          NDVI satelliittikuva kartalla — {fmt(entry.generationtime)}
        </Typography>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <Box
          ref={mapRef}
          sx={{ height: '100%', width: '100%', '& .leaflet-container': { height: '100%' } }}
        />
      </Box>
    </Box>
  );
}
