import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box, Typography, CircularProgress, Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { MapContainer, TileLayer, useMapEvents, Polygon, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { apiClient } from '../../api/client';

// Zoomaa kartan annettuihin koordinaatteihin
import { useEffect } from 'react';


// MapZoomer — tukee sekä center että bounds
function MapZoomer({ center, bounds }: {
  center: [number, number] | null;
  bounds: [[number, number], [number, number]] | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [30, 30] });
    } else if (center) {
      map.setView(center, 14);
    }
  }, [center, bounds, map]);
  return null;
}
// Klikkauksen käsittely
function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (geojson: object) => void;
}

export default function FieldSelectorMap({ open, onClose, onSelect }: Props) {
  const { t } = useTranslation();
  const [searchText, setSearchText] = useState('');
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [foundField, setFoundField] = useState<any | null>(null);
  const [searching, setSearching] = useState(false);
  const [clicking, setClicking] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [clickError, setClickError] = useState('');

  const [mapBounds, setMapBounds] = useState<[[number, number], [number, number]] | null>(null);

  useEffect(() => {
    if (!clickError) return;
    const timer = setTimeout(() => setClickError(''), 3000);
    return () => clearTimeout(timer);
  }, [clickError]);


  const handleSearch = async () => {
    if (!searchText.trim()) return;
    setSearching(true);
    setSearchError('');
    setFoundField(null);
    try {
      const res = await apiClient.get('/api/geocode', {
        params: { text: searchText, bbox: true }
      });
      const { lat, lon, bbox } = res.data;
      setMapCenter([lat, lon]);
      setMapBounds(bbox);
    } catch {
      setSearchError(t('geocodeError') || 'Paikkaa ei löydy');
    } finally {
      setSearching(false);
    }
  };


  const handleMapClick = async (lat: number, lon: number) => {
    setClicking(true);
    setClickError('');
    setFoundField(null);
    try {
      const res = await apiClient.get('/api/fields/by-location', { params: { lat, lon } });
      setFoundField(res.data);
    } catch (e: any) {
      if (e.response?.status === 404) {
        setClickError(t('noFieldFound') || 'Ei peltolohkoa tässä kohdassa');
      } else {
        setClickError(t('fieldSearchError') || 'Hakuvirhe');
      }
    } finally {
      setClicking(false);
    }
  };

  const handleConfirm = () => {
    if (!foundField) return;
    onSelect(foundField.geometry);  // ← pelkkä geometry, ei Feature-wrapper
    onClose();
  };
  const handleClose = () => {
    setFoundField(null);
    setSearchText('');
    setClickError('');
    setSearchError('');
    onClose();
  };

  // Polygon koordinaatit Leafletille [lat, lon]
  const polygonPositions = foundField?.geometry?.coordinates?.[0]?.map(
    ([lon, lat]: [number, number]) => [lat, lon] as [number, number]
  ) ?? [];

  // 
  //<Dialog open={open} onClose={handleClose} maxWidth={false} fullScreen>  // ← koko viewport
  // <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>  
  return (

    <Dialog open={open} onClose={handleClose} maxWidth="xl" fullWidth sx={{
      '& .MuiDialog-paper': {
        height: 'calc(100vh - 64px)',
        maxHeight: 'calc(100vh - 64px)',
      }
    }}>
      <DialogTitle>
        {t('selectFieldFromMap') || 'Valitse pelto kartalta'}
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Hakupalkki */}
        <Box sx={{ p: 2, display: 'flex', gap: 1 }}>
          <TextField
            size="small"
            fullWidth
            placeholder={t('searchPlaceholder') || 'Paikkakunta, osoite tai postinumero'}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={searching}
            startIcon={searching ? <CircularProgress size={16} /> : <SearchIcon />}
          >
            {t('search') || 'Hae'}
          </Button>
        </Box>

        {searchError && (
          <Box sx={{ px: 2, pb: 1 }}>
            <Alert severity="warning">{searchError}</Alert>
          </Box>
        )}

        {/* Kartta */}
        <Box sx={{ height: 0, flex: 1, minHeight: 0 }}>
          <MapContainer
            center={[64.5, 26.0]}
            zoom={5}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution="Esri World Imagery"
            />

            <MapZoomer center={mapCenter} bounds={mapBounds} />
            <ClickHandler onMapClick={handleMapClick} />

            {/* Löydetty pelto korostettuna */}
            {polygonPositions.length > 0 && (
              <Polygon
                positions={polygonPositions}
                pathOptions={{ color: '#ff7800', fillColor: '#ff7800', fillOpacity: 0.3, weight: 2 }}
              />
            )}
          </MapContainer>
        </Box>

        {/* Status */}
        <Box sx={{ px: 2, py: 1, minHeight: 40 }}>
          {clicking && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="caption">{t('searchingField') || 'Haetaan peltolohkoa...'}</Typography>
            </Box>
          )}
          {clickError && <Alert severity="info">{clickError}</Alert>}
          {foundField && (
            <Alert severity="success">
              {t('fieldFound') || 'Peltolohko löydetty — vahvista lisäys'}
            </Alert>
          )}
          {!clicking && !clickError && !foundField && (
            <Typography variant="caption" color="text.secondary">
              {t('clickFieldPrompt') || 'Klikkaa peltoaluetta kartalla'}
            </Typography>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>{t('cancel') || 'Peruuta'}</Button>
        <Button
          variant="contained"
          disabled={!foundField}
          onClick={handleConfirm}
        >
          {t('addField') || 'Lisää pelto'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}