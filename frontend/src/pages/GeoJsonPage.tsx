import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Alert,
  TextField, Stack, CircularProgress,
  Divider, Chip,
  Accordion, AccordionSummary, AccordionDetails,
} from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import GrassIcon from '@mui/icons-material/Grass';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import GeoJsonInput from '../components/ndvi/GeoJsonInput';
import { useAppStore } from '../store/appStore';
import { apiClient } from '../api/client';

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

    const name = fieldInfo?.name ?? '';
    const newId = await fetchImagesForGeometry(gj, startDate, today, name);

    if (newId) {
      const hasEntries = useAppStore.getState().ndviEntries.length > 0;
      if (hasEntries) {
        setSelectedField(newId);
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
            {fieldInfo?.name && (
              <Chip label={fieldInfo.name} size="small" color="primary" variant="outlined" />
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

            <GeoJsonInput
              initialValue={geoJsonInput}
              onInputChange={setGeoJsonInput}
              onValid={handleValid}
              onSubmit={handleSubmit}
              loading={loading}
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
                {fieldInfo.address && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOnIcon fontSize="small" color="action" />
                    <Typography variant="body2">{fieldInfo.address}</Typography>
                  </Box>
                )}
                {fieldInfo.fieldName && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <GrassIcon fontSize="small" color="action" />
                    <Typography variant="body2">{fieldInfo.fieldName}</Typography>
                    {fieldInfo.cropType && (
                      <Chip label={fieldInfo.cropType} size="small" color="primary" variant="outlined" />
                    )}
                  </Box>
                )}
                <Typography variant="caption" color="text.secondary">
                  {fieldInfo.centroid.lat.toFixed(5)}°N, {fieldInfo.centroid.lon.toFixed(5)}°E
                </Typography>
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
