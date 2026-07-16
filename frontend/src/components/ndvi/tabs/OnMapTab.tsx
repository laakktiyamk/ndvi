import { useEffect, useRef } from 'react';
import { Box, Typography, Alert } from '@mui/material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { MergedNdviEntry } from '../../../types';

interface Props {
  entry: MergedNdviEntry;
}

const fmt = (date: string) =>
  new Date(date).toLocaleDateString('fi-FI', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });

export default function OnMapTab({ entry }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<L.Map | null>(null);
  const overlayRef = useRef<L.ImageOverlay | null>(null);

  const image = entry.image;

  // Alusta kartta kerran
  useEffect(() => {
    if (!mapRef.current || !image) return;

    const bounds: L.LatLngBoundsExpression = [
      [image.image.minY, image.image.minX], // SW
      [image.image.maxY, image.image.maxX], // NE
    ];

    if (!leafletRef.current) {
      const map = L.map(mapRef.current, {
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri &mdash; Esri, Maxar, GeoEye, Earthstar Geographics',
          maxZoom: 19,
        }
      ).addTo(map);

      leafletRef.current = map;
    }

    const map = leafletRef.current;

    if (overlayRef.current) {
      overlayRef.current.remove();
    }

    const overlay = L.imageOverlay(image.image.dataUrl, bounds, {
      opacity: 0.85,
      interactive: false,
    }).addTo(map);

    overlayRef.current = overlay;
    map.fitBounds(bounds, { padding: [20, 20] });

    return () => {
      if (leafletRef.current) {
        leafletRef.current.remove();
        leafletRef.current = null;
        overlayRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Päivitä overlay kun entry vaihtuu
  useEffect(() => {
    if (!leafletRef.current || !image) return;

    const bounds: L.LatLngBoundsExpression = [
      [image.image.minY, image.image.minX],
      [image.image.maxY, image.image.maxX],
    ];

    if (overlayRef.current) {
      overlayRef.current.setUrl(image.image.dataUrl);
      overlayRef.current.setBounds(L.latLngBounds(bounds));
    }
  }, [entry.sentinelid, image]);

  if (!image) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        Tälle päivälle ei ole kuvaoverlaylle tarvittavia tietoja.
      </Alert>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary">
          NDVI satelliittikuva kartalla — {fmt(entry.generationtime)}
        </Typography>
      </Box>
      <Box
        ref={mapRef}
        sx={{
          flex: 1,
          minHeight: 0,
          '& .leaflet-container': { height: '100%', background: '#1a1a2e' },
        }}
      />
    </Box>
  );
}
