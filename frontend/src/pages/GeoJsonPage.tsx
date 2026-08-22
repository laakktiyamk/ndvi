import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Typography, Paper, Alert,
  TextField, Stack, CircularProgress,
  Divider, Chip,
  Accordion, AccordionSummary, AccordionDetails, IconButton
} from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import GrassIcon from '@mui/icons-material/Grass';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import GeoJsonInput from '../components/ndvi/GeoJsonInput';
import { useAppStore } from '../store/appStore';
import { apiClient } from '../api/client';


import AgricultureIcon from '@mui/icons-material/Agriculture';
import FieldSelectorMap from '../components/ndvi/FieldSelectorMap';

import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';




const today = new Date().toISOString().split('T')[0];

interface FieldInfo {
  centroid: { lat: number; lon: number };
  address: string;
  fieldName: string | null;
  cropType: string | null;
  name: string;
}

export default function GeoJsonPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const {
    geoJsonInput, setGeoJsonInput,
    setValidGeoJson,
    startDate, setStartDate,
    setSelectedField,
    fetchImagesForGeometry,
    imagesLoading: loading,
    imagesError: error,
  } = useAppStore();

  const [fieldInfo, setFieldInfo] = useState<FieldInfo | null>(null);
  const [fieldInfoLoading, setFieldInfoLoading] = useState(false);
  const [accordionOpen, setAccordionOpen] = useState(true);
  const [noDataFound, setNoDataFound] = useState(false);

  const [mapSelectorOpen, setMapSelectorOpen] = useState(false);

  const [editingName, setEditingName] = useState(false);
  const [customName, setCustomName] = useState('');

  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    if (fieldInfo?.name) setCustomName(fieldInfo.name);
  }, [fieldInfo]);


  const handleReset = () => {
    console.log('Resetting GeoJSON input and field info');
    setGeoJsonInput('');
    setValidGeoJson(null);
    setFieldInfo(null);
    setCustomName('');
    setEditingName(false);
    setAccordionOpen(true);
    setNoDataFound(false);
    setResetKey(k => k + 1);
  };

  const handleFieldSelected = async (geojson: object) => {
    const geojsonStr = JSON.stringify(geojson, null, 2);
    setGeoJsonInput(geojsonStr);       // tekstikenttään
    await handleValid(geojson);        // validointi + fieldInfo haku
  };

  const handleValid = async (gj: object | null) => {
    setValidGeoJson(gj);
    setFieldInfo(null);
    if (!gj) return;
    setFieldInfoLoading(true);
    try {
      const res = await apiClient.post<FieldInfo>('/api/fields/info', { geometry: gj });
      setFieldInfo(res.data);
    } catch {
      // optionaalinen
    } finally {
      setFieldInfoLoading(false);
    }
  };

  const handleSubmit = async (gj: object) => {
    setAccordionOpen(false);
    setNoDataFound(false);

    const name = customName || fieldInfo?.name || '';
    const newId = await fetchImagesForGeometry(gj, startDate, today, name);

    if (newId) {
      const hasEntries = useAppStore.getState().ndviEntries.length > 0;
      if (hasEntries) {
        setSelectedField(newId);
        handleReset();
        navigate('/fields', { state: { fromGeoJson: true } });
      } else {
        setNoDataFound(true);
      }
    }
  };

  return (
    <Box sx={{ maxWidth: 640, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <MapIcon color="primary" />
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {t('geoJsonTitle')}
        </Typography>
      </Box>

      <Accordion
        expanded={accordionOpen}
        onChange={(_, expanded) => setAccordionOpen(expanded)}
        sx={{ mb: 2 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontWeight: 500 }}>
              {t('geoJsonInput')}
            </Typography>
            {customName && (
              <Chip label={customName} size="small" color="primary" variant="outlined" />
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label={t('startDate')}
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
                size="small"
              />
              <TextField
                label={t('endDate')}
                type="date"
                value={today}
                disabled
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
                size="small"
                helperText={t('alwaysToday')}
              />
            </Stack>

            {/* Karttavalinta-painike */}
            <Button
              variant="outlined"
              startIcon={<AgricultureIcon />}
              onClick={() => setMapSelectorOpen(true)}
              fullWidth
            >
              {t('selectFromMap') || 'Valitse pelto kartalta'}
            </Button>

            <Divider>{t('or') || 'tai'}</Divider>

            <GeoJsonInput
              key={resetKey}  // resetoi komponentti kun resetKey muuttuu
              initialValue={geoJsonInput}
              onInputChange={setGeoJsonInput}
              onValid={handleValid}
              onSubmit={handleSubmit}
              loading={loading}
            />

            <FieldSelectorMap
              open={mapSelectorOpen}
              onClose={() => setMapSelectorOpen(false)}
              onSelect={handleFieldSelected}
            />
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Paper sx={{ p: 2.5 }}>
        <Stack spacing={2}>

          {fieldInfoLoading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="caption" color="text.secondary">
                {t('fetchingLocation')}
              </Typography>
            </Box>
          )}

          {fieldInfo && (
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 600, display: 'block', mb: 1 }}
              >
                {t('identifiedLocation')}
              </Typography>
              <Divider sx={{ mb: 1.5 }} />
              <Stack spacing={1}>
                {/* Osoite — vain näyttö */}
                {fieldInfo.address && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOnIcon fontSize="small" color="action" />
                    <Typography variant="body2">{fieldInfo.address}</Typography>
                  </Box>
                )}

                {/* Muokattava nimi — GrassIcon */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <GrassIcon fontSize="small" color="action" />
                  {editingName ? (
                    <>
                      <TextField
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        size="small"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && setEditingName(false)}
                      />
                      <IconButton size="small" onClick={() => setEditingName(false)}>
                        <CheckIcon fontSize="small" />
                      </IconButton>
                    </>
                  ) : (
                    <>
                      <Typography variant="body2">{customName || fieldInfo.name}</Typography>
                      <IconButton size="small" onClick={() => setEditingName(true)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </>
                  )}
                </Box>

                {/* Koordinaatit */}
                <Typography variant="caption" color="text.secondary">
                  {fieldInfo.centroid.lat.toFixed(5)}°N, {fieldInfo.centroid.lon.toFixed(5)}°E
                </Typography>
                <Box sx={{ pt: 1 }}>
                  <Button
                    variant="text"
                    size="small"
                    color="inherit"
                    onClick={handleReset}
                    sx={{ color: 'text.secondary' }}
                  >
                    {t('clearSelection') || 'Tyhjennä valinta'}
                  </Button>
                </Box>
              </Stack>
            </Box>
          )}

          {error && <Alert severity="error">{error}</Alert>}

          {noDataFound && (
            <Alert severity="info">{t('noNdviData')}</Alert>
          )}

          {loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                {t('fetchingNdviDates')}
              </Typography>
            </Box>
          )}

          {!fieldInfo && !loading && !error && !noDataFound && (
            <Typography variant="body2" color="text.secondary">
              {t('pasteGeoJsonPrompt')}
            </Typography>
          )}

        </Stack>
      </Paper>
    </Box>
  );
}
