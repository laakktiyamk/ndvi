import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box, Typography, CircularProgress, Alert,
  Chip, Stack, Collapse, IconButton, Divider,
  Stepper, Step, StepLabel,
  useTheme, useMediaQuery, MobileStepper,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CodeIcon from '@mui/icons-material/Code';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { MapContainer, TileLayer, useMapEvents, Polygon, useMap, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { apiClient } from '../../api/client';
import { useAppStore } from '../../store/appStore';

const today = new Date().toISOString().split('T')[0];

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

function ClickHandler({ onMapClick, disabled }: {
  onMapClick: (lat: number, lon: number) => void;
  disabled?: boolean;
}) {
  useMapEvents({
    click(e) {
      if (!disabled) onMapClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

// ─── Tyypit ───────────────────────────────────────────────────────────────────

interface CropParcel {
  tunnus: string;
  lohkonumero: string;
  kasvikoodi: string;  
  pinta_ala: number;
  luomuviljely: string;
  geometry: any;
}

interface CropType {
  kasvikoodi: string;  
  color: string;
}

interface FieldInfo {
  centroid: { lat: number; lon: number };
  address: string;
  fieldName: string | null;
  cropType: string | null;
  name: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

// ─── GeoJSON-bounds laskenta ──────────────────────────────────────────────────

function getGeometryBounds(geometry: any): [[number, number], [number, number]] | null {
  try {
    let coords: number[][] = [];
    const flatten = (c: any) => {
      if (typeof c[0] === 'number') coords.push(c);
      else c.forEach(flatten);
    };
    if (geometry.type === 'FeatureCollection') {
      geometry.features.forEach((f: any) => flatten(f.geometry?.coordinates ?? []));
    } else if (geometry.type === 'Feature') {
      flatten(geometry.geometry?.coordinates ?? []);
    } else {
      flatten(geometry.coordinates ?? []);
    }
    if (!coords.length) return null;
    const lons = coords.map(c => c[0]);
    const lats = coords.map(c => c[1]);
    return [
      [Math.min(...lats), Math.min(...lons)],
      [Math.max(...lats), Math.max(...lons)],
    ];
  } catch {
    return null;
  }
}

// ─── Komponentti ──────────────────────────────────────────────────────────────

export default function NewFieldDialog({ open, onClose }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const {
    startDate, setStartDate,
    fetchImagesForGeometry,
    setSelectedField,
    imagesLoading,
    setNewFieldAdded,
  } = useAppStore();

  // ── Step: 0 = aluevalinta, 1 = asetukset, 2 = haetaan ───────────────────
  const [activeStep, setActiveStep] = useState(0);
  const [fetchError, setFetchError] = useState('');
  const steps = [t('selectArea'), t('settingsAndName'), t('fetchingImages') || 'Fetching'];

  // ── Vaihe 1: kartta ───────────────────────────────────────────────────────
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

  // GeoJSON-paneeli
  const [geojsonPanelOpen, setGeojsonPanelOpen] = useState(false);
  const [geojsonText, setGeojsonText] = useState('');
  const [geojsonError, setGeojsonError] = useState('');
  const [geojsonValidating, setGeojsonValidating] = useState(false);
  const [geojsonPreview, setGeojsonPreview] = useState<any | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Vaihe 2: asetukset ────────────────────────────────────────────────────
  const [fieldInfo, setFieldInfo] = useState<FieldInfo | null>(null);
  const [fieldInfoLoading, setFieldInfoLoading] = useState(false);
  const [customName, setCustomName] = useState('');
  const [noDataFound, setNoDataFound] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Kasvilajien värit
  useEffect(() => {
    apiClient.get('/api/fields/crop-types')
      .then((res) => {
        const map = new Map<string, string>(
          res.data.map((ct: CropType) => [ct.kasvikoodi, ct.color])
        );
        setCropColorMap(map);
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    if (!clickError) return;
    const timer = setTimeout(() => setClickError(''), 3000);
    return () => clearTimeout(timer);
  }, [clickError]);

  useEffect(() => {
    if (!noDataFound) return;
    const timer = setTimeout(() => setNoDataFound(false), 4000);
    return () => clearTimeout(timer);
  }, [noDataFound]);

  useEffect(() => {
    if (!foundField?.peruslohkotunnus) return;
    setCropParcels([]);
    apiClient.get(`/api/fields/${foundField.peruslohkotunnus}/crop-parcels`)
      .then((res) => setCropParcels(res.data))
      .catch(() => { });
  }, [foundField]);

  const fetchFieldInfo = async (geometry: object) => {
    setFieldInfo(null);
    setFieldInfoLoading(true);
    try {
      const res = await apiClient.post<FieldInfo>('/api/fields/info', { geometry });
      setFieldInfo(res.data);
      setCustomName(res.data.name || '');
    } catch {
      // optionaalinen
    } finally {
      setFieldInfoLoading(false);
    }
  };

  const getCropColor = (kasvikoodi: string): string => {
    if (cropColorMap.has(kasvikoodi)) return cropColorMap.get(kasvikoodi)!;
    let hash = 0;
    for (const char of kasvikoodi) hash = char.charCodeAt(0) + ((hash << 5) - hash);
    return `hsl(${Math.abs(hash) % 360}, 65%, 55%)`;
  };

  // ─── GeoJSON-validointi ────────────────────────────────────────────────────

  const validateAndPreview = async (text: string, autoClose = false) => {
    setGeojsonError('');
    setGeojsonPreview(null);
    if (!text.trim()) return;
    let parsed: object;
    try {
      parsed = JSON.parse(text);
    } catch (err: any) {
      setGeojsonError('Virheellinen JSON: ' + err.message);
      return;
    }
    setGeojsonValidating(true);
    try {
      const res = await apiClient.post('/api/validate/geojson', { geometry: parsed });
      if (res.data.valid && res.data.geometry) {
        setGeojsonPreview(res.data.geometry);
        const bounds = getGeometryBounds(res.data.geometry);
        if (bounds) { setMapBounds(bounds); setMapCenter(null); }
        setGeojsonError('');
        if (autoClose) setGeojsonPanelOpen(false);
      } else {
        setGeojsonError((res.data.errors ?? []).join(', ') || 'Virheellinen GeoJSON');
      }
    } catch {
      setGeojsonError('Validointi epäonnistui');
    } finally {
      setGeojsonValidating(false);
    }
  };

  useEffect(() => {
    if (!geojsonPreview) return;
    setFoundField({ geometry: geojsonPreview, _fromGeojson: true });
    setCropParcels([]);
  }, [geojsonPreview]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      setGeojsonText(text);
      setGeojsonPanelOpen(true);
      await validateAndPreview(text);
    } catch {
      setGeojsonError('Tiedoston lukeminen epäonnistui');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ─── Karttahaku + klikkaus ─────────────────────────────────────────────────

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
    setGeojsonPreview(null);
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

  // ─── Stepperit ─────────────────────────────────────────────────────────────

  const handleNext = async () => {
    if (!foundField) return;
    await fetchFieldInfo(foundField.geometry);
    setActiveStep(1);
  };

  const handleBack = () => {
    setActiveStep(0);
    setNoDataFound(false);
    setSubmitError('');
    setFetchError('');
  };


  const handleSubmit = async () => {
    if (!foundField) return;
    setNoDataFound(false);
    setSubmitError('');
    setFetchError('');
    setActiveStep(2);

    const name = customName || fieldInfo?.name || '';
    const newId = await fetchImagesForGeometry(
      foundField.geometry,
      startDate,
      today,
      name,
      cropParcels,  // ← lisäys
    );

    if (newId) {
      const hasEntries = useAppStore.getState().ndviEntries.length > 0;
      if (hasEntries) {
        setSelectedField(newId);
        setNewFieldAdded(true);
        handleClose();
        navigate('/fields');
      } else {
        setActiveStep(1);
        setNoDataFound(true);
      }
    } else {
      setFetchError(t('fetchError') || 'Haku epäonnistui');
    }
  };

  // ─── Reset + sulkeminen ────────────────────────────────────────────────────

  const handleClose = () => {
    setActiveStep(0);
    setSearchText('');
    setMapCenter(null);
    setMapBounds(null);
    setFoundField(null);
    setCropParcels([]);
    setSearchError('');
    setClickError('');
    setGeojsonText('');
    setGeojsonError('');
    setGeojsonPreview(null);
    setGeojsonPanelOpen(false);
    setFieldInfo(null);
    setCustomName('');
    setNoDataFound(false);
    setSubmitError('');
    setFetchError('');
    onClose();
  };

  const polygonPositions = foundField?.geometry?.coordinates?.[0]?.map(
    ([lon, lat]: [number, number]) => [lat, lon] as [number, number]
  ) ?? [];

  // ─── Vaihe 1: aluevalinta ──────────────────────────────────────────────────

  const step1 = (
    <>
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            size="small"
            fullWidth
            placeholder={t('searchPlaceholder')}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={searching || !searchText.trim()}
            startIcon={searching ? <CircularProgress size={16} /> : <SearchIcon />}
          >
            {t('search')}
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant={geojsonPanelOpen ? 'contained' : 'outlined'}
            startIcon={<CodeIcon fontSize="small" />}
            onClick={() => setGeojsonPanelOpen(v => !v)}
          >
            {t('pasteGeoJson')}
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<UploadFileIcon fontSize="small" />}
            onClick={() => fileInputRef.current?.click()}
          >
            {t('loadFromFile')}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.geojson"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </Box>
      </Box>

      {searchError && (
        <Box sx={{ px: 2, pb: 1 }}>
          <Alert severity="warning">{searchError}</Alert>
        </Box>
      )}

      <Collapse in={geojsonPanelOpen}>
        <Box sx={{ px: 2, pb: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Divider />
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.secondary">
              {t('pasteGeoJsonHint')}
            </Typography>
            <IconButton size="small" onClick={() => setGeojsonPanelOpen(false)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          <TextField
            multiline
            rows={5}
            fullWidth
            size="small"
            value={geojsonText}
            onChange={(e) => {
              const val = e.target.value;
              setGeojsonText(val);
              setGeojsonPreview(null);
              setFoundField(null);
              setGeojsonError('');
              clearTimeout((window as any).__geojsonTimer);
              (window as any).__geojsonTimer = setTimeout(() => validateAndPreview(val, true), 600);
            }}
            placeholder={'{ "type": "Polygon", "coordinates": [...] }'}
            error={!!geojsonError}
            slotProps={{ input: { sx: { fontFamily: 'monospace', fontSize: '0.75rem' } } }}
          />
          {geojsonError && <Alert severity="error" sx={{ py: 0.5 }}>{geojsonError}</Alert>}
          {geojsonPreview && !geojsonError && (
            <Alert severity="success" sx={{ py: 0.5 }}>{t('geojsonValidAndShown')}</Alert>
          )}
          {geojsonValidating && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={14} />
              <Typography variant="caption" color="text.secondary">Validoidaan...</Typography>
            </Box>
          )}
        </Box>
      </Collapse>

      <Box sx={{ height: 0, flex: 1, minHeight: 0 }}>
        <MapContainer center={[64.5, 26.0]} zoom={5} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="Esri World Imagery"
          />
          <MapZoomer center={mapCenter} bounds={mapBounds} />
          <ClickHandler onMapClick={handleMapClick} disabled={geojsonPanelOpen} />

          {!geojsonPreview && polygonPositions.length > 0 && (
            <Polygon
              positions={polygonPositions}
              pathOptions={{ color: '#ff7800', fillColor: '#ff7800', fillOpacity: 0.3, weight: 2 }}
            />
          )}
          {geojsonPreview && (
            <GeoJSON
              key={JSON.stringify(geojsonPreview).slice(0, 40)}
              data={geojsonPreview}
              style={{ color: '#1976d2', fillColor: '#1976d2', fillOpacity: 0.25, weight: 2 }}
            />
          )}
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

      <Box sx={{ px: 2, py: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minHeight: 40 }}>
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            {clicking && (
              <>
                <CircularProgress size={16} />
                <Typography variant="caption">{t('searchingField')}</Typography>
              </>
            )}
            {clickError && <Alert severity="info" sx={{ py: 0 }}>{clickError}</Alert>}
            {foundField && (
              <Alert severity="success" sx={{ py: 0, flex: 1 }}>
                {foundField._fromGeojson ? t('geojsonReady') : t('fieldFound')}
                {foundField.peruslohkotunnus && (
                  <Typography variant="caption" sx={{ display: 'block' }}>
                    {foundField.peruslohkotunnus} · {foundField.pinta_ala} ha
                  </Typography>
                )}
              </Alert>
            )}
            {!clicking && !clickError && !foundField && (
              <Typography variant="caption" color="text.secondary">
                {geojsonPanelOpen ? t('geojsonPanelHint') : t('clickFieldPrompt')}
              </Typography>
            )}
          </Box>
        </Box>

        {cropParcels.length > 0 && (
          <Stack direction="row" sx={{ mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
            {cropParcels.map((cp) => (
              <Chip
                key={cp.tunnus}
                size="small"
                label={`${cp.lohkonumero} · ${t(`crop:${cp.kasvikoodi}`)} · ${cp.pinta_ala} ha${cp.luomuviljely === '1' ? ' 🌿' : ''}`}
                sx={{ backgroundColor: getCropColor(cp.kasvikoodi), color: '#000', fontWeight: 500 }}
              />
            ))}
          </Stack>
        )}
      </Box>
    </>
  );

  // ─── Vaihe 2: asetukset ────────────────────────────────────────────────────

  const step2 = (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {fieldInfoLoading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress size={16} />
          <Typography variant="caption" color="text.secondary">{t('fetchingLocation')}</Typography>
        </Box>
      )}

      {fieldInfo && (
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            {t('identifiedLocation')}
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>{fieldInfo.address}</Typography>
          <Typography variant="caption" color="text.secondary">
            {fieldInfo.centroid.lat.toFixed(5)}°N, {fieldInfo.centroid.lon.toFixed(5)}°E
          </Typography>
        </Box>
      )}

      <Divider />

      <TextField
        label={t('fieldName')}
        value={customName}
        onChange={(e) => setCustomName(e.target.value)}
        size="small"
        fullWidth
        helperText={t('fieldNameHelper')}
      />

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

      {noDataFound && <Alert severity="info">{t('noNdviData')}</Alert>}
      {submitError && <Alert severity="error">{submitError}</Alert>}
    </Box>
  );

  // ─── Vaihe 3: haetaan kuvia ───────────────────────────────────────────────

  const step3 = (
    <Box sx={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
      py: 6,
      px: 3,
    }}>
      {!fetchError ? (
        <>
          <CircularProgress size={56} />
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {t('fetchingImages') || 'Fetching NDVI Images...'}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
            {t('fetchingImagesHint') || 'This may take a moment. Please wait.'}
          </Typography>
        </>
      ) : (
        <>
          <Alert severity="error" sx={{ width: '100%', maxWidth: 400 }}>
            {fetchError}
          </Alert>
          <Button variant="contained" onClick={handleBack}>
            OK
          </Button>
        </>
      )}
    </Box>
  );

  // ─── Render ─────────────────────────────────────────────────────────────────

  const stepContent = [step1, step2, step3][activeStep];

  return (
    <Dialog
      open={open}
      onClose={activeStep === 2 ? undefined : handleClose} // ei suljettavissa haun aikana
      maxWidth="xl"
      fullWidth
      fullScreen={isMobile}
      sx={{
        '& .MuiDialog-paper': {
          height: isMobile ? '100%' : 'calc(100vh - 64px)',
          maxHeight: isMobile ? '100%' : 'calc(100vh - 64px)',
        }
      }}
    >
      <DialogTitle sx={{ pb: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t('newField')}
          </Typography>
          {/* Ei close-nappia step 3:ssa haun aikana */}
          {(activeStep < 2 || !!fetchError) && (
            <IconButton size="small" onClick={handleClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Box>

        {!isMobile && (
          <Stepper activeStep={activeStep} sx={{ pt: 1.5, pb: 0.5 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        )}
      </DialogTitle>

      <DialogContent
        sx={{
          p: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: activeStep === 0 ? 'hidden' : 'auto',
        }}
      >
        {stepContent}
      </DialogContent>

      {/* Napit — piilotetaan step 3:ssa */}
      {activeStep < 2 && (
        isMobile ? (
          <MobileStepper
            variant="dots"
            steps={3}
            position="static"
            activeStep={activeStep}
            backButton={
              activeStep === 0
                ? <Button size="small" onClick={handleClose}>{t('cancel')}</Button>
                : <Button size="small" onClick={handleBack} startIcon={<KeyboardArrowLeftIcon />}>
                  {t('back')}
                </Button>
            }
            nextButton={
              activeStep === 0
                ? <Button size="small" onClick={handleNext} disabled={!foundField} endIcon={<KeyboardArrowRightIcon />}>
                  {t('next')}
                </Button>
                : <Button
                  size="small"
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={imagesLoading}
                >
                  {t('fetchNdviImages') || 'Hae kuvat'}
                </Button>
            }
          />
        ) : (
          <DialogActions sx={{ px: 3, py: 2 }}>
            {activeStep === 0 ? (
              <>
                <Button onClick={handleClose}>{t('cancel')}</Button>
                <Button
                  variant="contained"
                  disabled={!foundField}
                  onClick={handleNext}
                  endIcon={<KeyboardArrowRightIcon />}
                >
                  {t('next')}
                </Button>
              </>
            ) : (
              <>
                <Button onClick={handleBack} startIcon={<KeyboardArrowLeftIcon />}>
                  {t('back')}
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={imagesLoading}
                >
                  {t('fetchNdviImages')}
                </Button>
              </>
            )}
          </DialogActions>
        )
      )}
    </Dialog>
  );
}