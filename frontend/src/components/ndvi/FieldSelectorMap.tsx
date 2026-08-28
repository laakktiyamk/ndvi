import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog, DialogTitle, DialogContent,
  Button, TextField, Box, Typography, CircularProgress, Alert,
  Chip, Stack,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { MapContainer, TileLayer, useMapEvents, Polygon, useMap, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { apiClient } from '../../api/client';

// ─── MapZoomer ────────────────────────────────────────────────────────────────

function MapZoomer({ center, bounds }: {
  center: [number, number] | null;
  bounds: [[number, number], [number, number]] | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (bounds) map.fitBounds(bounds, { padding: [30, 30] });
    else if (center) map.setView(center, 14);
  }, [center, bounds, map]);
  return null;
}

// ─── ClickHandler ─────────────────────────────────────────────────────────────

function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lon: number) => void }) {
  useMapEvents({ click(e) { onMapClick(e.latlng.lat, e.latlng.lng); } });
  return null;
}

// ─── Tyypit ───────────────────────────────────────────────────────────────────

interface CropParcel {
  tunnus: string;
  lohkonumero: string;
  kasvikoodi: string;
  kasvikoodi_selite_fi: string;
  pinta_ala: number;
  luomuviljely: string;
  geometry: any;
}

interface CropType {
  kasvikoodi: string;
  kasvikoodi_selite_fi: string;
  color: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (geojson: object) => void;
}

// ─── Komponentti ──────────────────────────────────────────────────────────────

export default function FieldSelectorMap({ open, onClose, onSelect }: Props) {
  const { t } = useTranslation();
  const [searchText, setSearchText] = useState('');
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [mapBounds, setMapBounds] = useState<[[number, number], [number, number]] | null>(null);
  const [foundField, setFoundField] = useState<any | null>(null);
  const [cropParcels, setCropParcels] = useState<CropParcel[]>([]);
  const [cropColorMap, setCropColorMap] = useState<Map<string, string>>(new Map());
  const [searching, setSearching] = useState(false);
  const [clicking, setClicking] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [clickError, setClickError] = useState('');

  // Haetaan kasvilajien värit kannasta kerran mountissa
  useEffect(() => {
    apiClient
      .get('/api/crop-types')
      .then((res) => {
        const map = new Map<string, string>(
          res.data.map((ct: CropType) => [ct.kasvikoodi, ct.color])
        );
        setCropColorMap(map);
      })
      .catch(() => { });
  }, []);

  // clickError häviää 3s kuluttua
  useEffect(() => {
    if (!clickError) return;
    const timer = setTimeout(() => setClickError(''), 3000);
    return () => clearTimeout(timer);
  }, [clickError]);

  // Kasvulohkohaku kun peltolohko löytyy
  useEffect(() => {
    if (!foundField?.peruslohkotunnus) return;
    setCropParcels([]);
    apiClient
      .get(`/api/fields/${foundField.peruslohkotunnus}/crop-parcels`)
      .then((res) => setCropParcels(res.data))
      .catch(() => { });
  }, [foundField]);

  // Väri kannasta tai fallback hashista
  const getCropColor = (kasvikoodi: string): string => {
    if (cropColorMap.has(kasvikoodi)) return cropColorMap.get(kasvikoodi)!;
    let hash = 0;
    for (const char of kasvikoodi) {
      hash = char.charCodeAt(0) + ((hash << 5) - hash);
    }
    return `hsl(${Math.abs(hash) % 360}, 65%, 55%)`;
  };

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleSearch = async () => {
    if (!searchText.trim()) return;
    setSearching(true);
    setSearchError('');
    setFoundField(null);
    setCropParcels([]);
    try {
      const res = await apiClient.get('/api/geocode', { params: { text: searchText, bbox: true } });
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
    setCropParcels([]);
    try {
      const res = await apiClient.get('/api/fields/by-location', { params: { lat, lon } });
      setFoundField(res.data);
    } catch (e: any) {
      setClickError(e.response?.status === 404
        ? t('noFieldFound') || 'Ei peltolohkoa tässä kohdassa'
        : t('fieldSearchError') || 'Hakuvirhe'
      );
    } finally {
      setClicking(false);
    }
  };

  const handleConfirm = () => {
    if (!foundField) return;
    onSelect(foundField.geometry);
    onClose();
  };

  const handleClose = () => {
    setFoundField(null);
    setCropParcels([]);
    setSearchText('');
    setClickError('');
    setSearchError('');
    onClose();
  };

  // Peltolohkon polygon Leafletille [lat, lon]
  const polygonPositions = foundField?.geometry?.coordinates?.[0]?.map(
    ([lon, lat]: [number, number]) => [lat, lon] as [number, number]
  ) ?? [];

  // ─── Render ─────────────────────────────────────────────────────────────────

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
          <MapContainer center={[64.5, 26.0]} zoom={5} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution="Esri World Imagery"
            />
            <MapZoomer center={mapCenter} bounds={mapBounds} />
            <ClickHandler onMapClick={handleMapClick} />

            {/* Peltolohko oranssilla */}
            {polygonPositions.length > 0 && (
              <Polygon
                positions={polygonPositions}
                pathOptions={{ color: '#ff7800', fillColor: '#ff7800', fillOpacity: 0.3, weight: 2 }}
              />
            )}

            {/* Kasvulohkot omilla väreillään */}
            {cropParcels.map((cp) => (
              <GeoJSON
                key={cp.tunnus}
                data={cp.geometry}
                style={{
                  color: getCropColor(cp.kasvikoodi),
                  fillColor: getCropColor(cp.kasvikoodi),
                  fillOpacity: 0.5,
                  weight: 1.5,
                }}
              />
            ))}
          </MapContainer>
        </Box>

        <Box sx={{ px: 2, py: 1, minHeight: 56 }}>

          {/* Ylin rivi: status + napit */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>

            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              {clicking && (
                <>
                  <CircularProgress size={16} />
                  <Typography variant="caption">{t('searchingField') || 'Haetaan peltolohkoa...'}</Typography>
                </>
              )}
              {clickError && <Alert severity="info" sx={{ py: 0 }}>{clickError}</Alert>}
              {foundField && (
                <Alert severity="success" sx={{ py: 0, flex: 1 }}>
                  {t('fieldFound') || 'Peltolohko löydetty — vahvista lisäys'}
                  {foundField.peruslohkotunnus && (
                    <Typography variant="caption" sx={{ display: 'block' }}>
                      {foundField.peruslohkotunnus} · {foundField.pinta_ala} ha
                    </Typography>
                  )}
                </Alert>
              )}
              {!clicking && !clickError && !foundField && (
                <Typography variant="caption" color="text.secondary">
                  {t('clickFieldPrompt') || 'Klikkaa peltoaluetta kartalla'}
                </Typography>
              )}
            </Box>

            {/* Napit oikealla */}
            <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
              <Button onClick={handleClose}>{t('cancel') || 'Peruuta'}</Button>
              <Button variant="contained" disabled={!foundField} onClick={handleConfirm}>
                {t('addField') || 'Lisää pelto'}
              </Button>
            </Box>
          </Box>

          {/* Toinen rivi: chippit */}
          {cropParcels.length > 0 && (
            <Stack direction="row" sx={{ mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
              {cropParcels.map((cp) => (
                <Chip
                  key={cp.tunnus}
                  size="small"
                  label={`${cp.lohkonumero} · ${cp.kasvikoodi_selite_fi} · ${cp.pinta_ala} ha${cp.luomuviljely === '1' ? ' 🌿' : ''}`}
                  sx={{ backgroundColor: getCropColor(cp.kasvikoodi), color: '#000', fontWeight: 500 }}
                />
              ))}
            </Stack>
          )}
        </Box>
      </DialogContent>      

    </Dialog>
  );
}