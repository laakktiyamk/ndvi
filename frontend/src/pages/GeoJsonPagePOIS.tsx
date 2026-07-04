import { useState } from 'react';
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
import useFetchDatesList from '../hooks/useFetchDatesList';
import { useAppStore } from '../store/appStore';
import { apiClient } from '../api/client';

const today = new Date().toISOString().split('T')[0];

interface FieldInfo {
  centroid: { lat: number; lon: number };
  address: string;
  fieldName: string | null;
  cropType:  string | null;
  name: string;
}

export default function GeoJsonPage() {
  const navigate = useNavigate();

  const {
    geoJsonInput, setGeoJsonInput,
    setValidGeoJson,
    startDate, setStartDate,
    resetFields,
  } = useAppStore();

  const [submittedGeoJson, setSubmittedGeoJson] = useState<object | null>(null);
  const [fieldInfo, setFieldInfo]               = useState<FieldInfo | null>(null);
  const [fieldInfoLoading, setFieldInfoLoading] = useState(false);
  const [accordionOpen, setAccordionOpen]       = useState(true);

  const { data, loading, error } = useFetchDatesList(
    submittedGeoJson,
    startDate,
    today,
    fieldInfo?.name ?? '',
  );

  if (data && data.dates?.length > 0) {
    resetFields();
    navigate('/fields', { state: { fromGeoJson: true, dates: data.dates } });
  }

  const handleValid = async (gj: object | null) => {
    setValidGeoJson(gj);
    setFieldInfo(null);
    if (!gj) return;

    setFieldInfoLoading(true);
    try {
      const res = await apiClient.post<FieldInfo>('/api/fields/info', { geometry: gj });
      setFieldInfo(res.data);
    } catch {
      // info on optionaalinen
    } finally {
      setFieldInfoLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 640, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <MapIcon color="primary" />
        <Typography variant="h5" fontWeight={700}>GeoJSON — Hae NDVI-kuvat</Typography>
      </Box>

      {/* Accordion — sulkeutuu kun haku käynnistyy */}
      <Accordion
        expanded={accordionOpen}
        onChange={(_, expanded) => setAccordionOpen(expanded)}
        sx={{ mb: 2 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography fontWeight={500}>GeoJSON-syöte</Typography>
            {fieldInfo?.name && (
              <Chip label={fieldInfo.name} size="small" color="primary" variant="outlined" />
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Alkupäivä"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
                size="small"
              />
              <TextField
                label="Loppupäivä"
                type="date"
                value={today}
                disabled
                InputLabelProps={{ shrink: true }}
                fullWidth
                size="small"
                helperText="Aina kuluva päivä"
              />
            </Stack>

            <GeoJsonInput
              initialValue={geoJsonInput}
              onInputChange={setGeoJsonInput}
              onValid={handleValid}
              onSubmit={(gj) => {
                const geometryToSubmit = (fieldInfo as any)?.geometry ?? gj;
                setSubmittedGeoJson(geometryToSubmit);
                setAccordionOpen(false);  // ← sulkee accordion haun alkaessa
              }}
              loading={loading}
            />
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Paper sx={{ p: 2.5 }}>
        <Stack spacing={2}>

          {/* Sijaintitietojen lataus */}
          {fieldInfoLoading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="caption" color="text.secondary">
                Haetaan sijaintitietoja...
              </Typography>
            </Box>
          )}

          {/* Tunnistettu sijainti */}
          {fieldInfo && (
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={1}>
                TUNNISTETTU SIJAINTI
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

          {data && data.dates?.length === 0 && (
            <Alert severity="info">Valitulle alueelle ei löytynyt NDVI-dataa.</Alert>
          )}

          {loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                Haetaan NDVI-päivämääriä...
              </Typography>
            </Box>
          )}

          {!fieldInfo && !loading && !error && (
            <Typography variant="body2" color="text.secondary">
              Liitä GeoJSON yllä olevaan kenttään aloittaaksesi.
            </Typography>
          )}

        </Stack>
      </Paper>
    </Box>
  );
}

const today = new Date().toISOString().split('T')[0];

interface FieldInfo {
  centroid: { lat: number; lon: number };
  address: string;
  fieldName: string | null;
  cropType:  string | null;
  name: string;
}

export default function GeoJsonPage() {
  const navigate = useNavigate();

  const {
    geoJsonInput, setGeoJsonInput,
    validGeoJson, setValidGeoJson,
    startDate, setStartDate,
  } = useAppStore();

  const [submittedGeoJson, setSubmittedGeoJson] = useState<object | null>(null);
  const [fieldInfo, setFieldInfo]               = useState<FieldInfo | null>(null);
  const [fieldInfoLoading, setFieldInfoLoading] = useState(false);

  // name välitetään hookille → servicelle → backendille → tallennetaan kantaan
  const { data, loading, error } = useFetchDatesList(
    submittedGeoJson,
    startDate,
    today,
    fieldInfo?.name ?? '',
  );

  if (data && data.dates?.length > 0) {
    navigate('/fields', { state: { fromGeoJson: true, dates: data.dates } });
  }

  const handleValid = async (gj: object | null) => {
    setValidGeoJson(gj);
    setFieldInfo(null);
    if (!gj) return;

    setFieldInfoLoading(true);
    try {
      const res = await apiClient.post<FieldInfo>('/api/fields/info', { geometry: gj });
      setFieldInfo(res.data);
    } catch {
      // info on optionaalinen — ei virhettä käyttäjälle
    } finally {
      setFieldInfoLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 640, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <MapIcon color="primary" />
        <Typography variant="h5" fontWeight={700}>GeoJSON — Hae NDVI-kuvat</Typography>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Alkupäivä"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
              size="small"
            />
            <TextField
              label="Loppupäivä"
              type="date"
              value={today}
              disabled
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
              size="small"
              helperText="Aina kuluva päivä"
            />
          </Stack>

          <GeoJsonInput
            initialValue={geoJsonInput}
            onInputChange={setGeoJsonInput}
            onValid={handleValid}
            onSubmit={(gj) => {
              // Käytetään backendiltä palautettua korjattua geometriaa jos saatavilla
              const geometryToSubmit = (fieldInfo as any)?.geometry ?? gj;
              setSubmittedGeoJson(geometryToSubmit);
            }}
            loading={loading}
          />

          {/* Sijaintitietojen lataus */}
          {fieldInfoLoading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="caption" color="text.secondary">
                Haetaan sijaintitietoja...
              </Typography>
            </Box>
          )}

          {/* Tunnistettu sijainti */}
          {fieldInfo && (
            <Box sx={{ bgcolor: 'background.default', borderRadius: 2, p: 2 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={1}>
                TUNNISTETTU SIJAINTI
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

          {data && data.dates?.length === 0 && (
            <Alert severity="info">Valitulle alueelle ei löytynyt NDVI-dataa.</Alert>
          )}

          {loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                Haetaan NDVI-päivämääriä...
              </Typography>
            </Box>
          )}
        </Stack>
      </Paper>
    </Box>
  );
}
