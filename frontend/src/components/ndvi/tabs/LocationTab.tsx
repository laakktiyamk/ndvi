import { useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, Alert } from '@mui/material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';


import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});


interface Props {
  geometry: { type: string; coordinates: unknown[] };
  fieldName?: string;
}

function getCentroid(geometry: { type: string; coordinates: unknown[] }): [number, number] | null {
  try {
    if (geometry.type === 'Polygon') {
      const ring = (geometry.coordinates as number[][][])[0];
      const lat = ring.reduce((s, c) => s + c[1], 0) / ring.length;
      const lng = ring.reduce((s, c) => s + c[0], 0) / ring.length;
      return [lat, lng];
    }
    if (geometry.type === 'MultiPolygon') {
      const allPoints = (geometry.coordinates as number[][][][]).flatMap(poly => poly[0]);
      const lat = allPoints.reduce((s, c) => s + c[1], 0) / allPoints.length;
      const lng = allPoints.reduce((s, c) => s + c[0], 0) / allPoints.length;
      return [lat, lng];
    }
  } catch { /* ei tehdä mitään */ }
  return null;
}

export default function LocationTab({ geometry, fieldName }: Props) {
  const { t } = useTranslation();
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<L.Map | null>(null);
  const mapInitialized = useRef(false);

  const centroid = useMemo(() => getCentroid(geometry), [geometry]);

  useEffect(() => {
    if (!centroid || mapInitialized.current) return;

    const raf = requestAnimationFrame(() => {
      if (!mapRef.current || mapInitialized.current) return;
      mapInitialized.current = true;

      const map = L.map(mapRef.current, {
        center: [65.5, 26.0],
        zoom: 5,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker(centroid);
      const popupName = fieldName ?? t('unnamedArea');
      if (fieldName) marker.bindPopup(`<b>${popupName}</b>`).openPopup();
      marker.addTo(map);

      leafletRef.current = map;
    });

    return () => {
      cancelAnimationFrame(raf);
      leafletRef.current?.remove();
      leafletRef.current = null;
      mapInitialized.current = false;
    };
  }, [centroid, fieldName, t]);

  if (!centroid) {
    return <Alert severity="warning" sx={{ m: 2 }}>{t('noLocationGeometry')}</Alert>;
  }

  return (
    <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
        <Typography variant="caption" color="text.secondary">
          {t('aoiLocation')} — {fieldName ?? t('unnamedArea')}
        </Typography>
      </Box>
      <Box
        ref={mapRef}
        sx={{ flex: 1, minHeight: 0, '& .leaflet-container': { height: '100%' } }}
      />
    </Box>
  );
}