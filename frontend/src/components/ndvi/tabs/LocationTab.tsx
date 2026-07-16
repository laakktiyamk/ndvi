import { useEffect, useRef, useMemo } from 'react';
import { Box, Typography, Alert } from '@mui/material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
  } catch {
    // ei tehdä mitään
  }
  return null;
}

export default function LocationTab({ geometry, fieldName }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<L.Map | null>(null);

  const centroid = useMemo(() => getCentroid(geometry), [geometry]);

  useEffect(() => {
    if (!mapRef.current || !centroid) return;
    if (leafletRef.current) return;

    const map = L.map(mapRef.current, {
      center: [65.5, 26.0], // Suomi kokonaisuudessaan näkyvissä
      zoom: 5,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker(centroid);
    if (fieldName) {
      marker.bindPopup(`<b>${fieldName}</b>`).openPopup();
    }
    marker.addTo(map);

    leafletRef.current = map;

    return () => {
      if (leafletRef.current) {
        leafletRef.current.remove();
        leafletRef.current = null;
      }
    };
  }, [centroid, fieldName]);

  if (!centroid) {
    return (
      <Alert severity="warning" sx={{ m: 2 }}>
        Sijaintia ei voitu laskea geometriasta.
      </Alert>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary">
          AOI:n sijainti — {fieldName ?? 'Nimetön alue'}
        </Typography>
      </Box>
      <Box
        ref={mapRef}
        sx={{
          flex: 1,
          minHeight: 0,
          '& .leaflet-container': { height: '100%' },
        }}
      />
    </Box>
  );
}
