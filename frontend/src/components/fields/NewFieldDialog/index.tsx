import { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, IconButton,
  Stepper, Step, StepLabel,
  useTheme, useMediaQuery, MobileStepper,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { apiClient } from '../../../api/client';
import { useAppStore } from '../../../store/appStore';
import Step1Area from './steps/Step1Area';
import Step2Settings from './steps/Step2Settings';
import Step3Loading from './steps/Step3Loading';
import type { CropParcel, CropType, FieldInfo, Props } from './types';

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
    growingSeason,
  } = useAppStore();

  // ── Stepper ───────────────────────────────────────────────────────────────
  const [activeStep, setActiveStep] = useState(0);
  const [fetchError, setFetchError] = useState('');
  const steps = [t('selectArea'), t('settingsAndName'), t('fetchingImages') || 'Fetching'];

  // ── Kartta & haku ─────────────────────────────────────────────────────────
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
  const [currentZoom, setCurrentZoom] = useState(5);
  const mapRef = useRef<any>(null);
  const [bboxFields, setBboxFields] = useState<any[]>([]);
  const [bboxActive, setBboxActive] = useState(false);

  // ── GeoJSON-syöte ─────────────────────────────────────────────────────────
  const [geojsonPanelOpen, setGeojsonPanelOpen] = useState(false);
  const [geojsonText, setGeojsonText] = useState('');
  const [geojsonError, setGeojsonError] = useState('');
  const [geojsonValidating, setGeojsonValidating] = useState(false);
  const [geojsonPreview, setGeojsonPreview] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Vaihe 2 ───────────────────────────────────────────────────────────────
  const [fieldInfo, setFieldInfo] = useState<FieldInfo | null>(null);
  const [fieldInfoLoading, setFieldInfoLoading] = useState(false);
  const [customName, setCustomName] = useState('');
  const [noDataFound, setNoDataFound] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // ── endDate kasvukauden mukaan ────────────────────────────────────────────
  const today = new Date().toISOString().split('T')[0];

  const endDate = useMemo(() => {
    if (!growingSeason) return today;
    const seasonEnd = new Date(
      new Date().getFullYear(),
      growingSeason.endMonth - 1,
      growingSeason.endDay
    ).toISOString().split('T')[0];
    return today < seasonEnd ? today : seasonEnd;
  }, [growingSeason, today]);

  // ── Efektit ───────────────────────────────────────────────────────────────

  useEffect(() => {
    apiClient.get('/api/fields/crop-types')
      .then((res) => {
        const map = new Map<string, string>(
          res.data.map((ct: CropType) => [ct.kasvikoodi, ct.color])
        );
        setCropColorMap(map);
      })
      .catch(() => {});
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
      .catch(() => {});
  }, [foundField]);

  useEffect(() => {
    if (!geojsonPreview) return;
    setFoundField({ geometry: geojsonPreview, _fromGeojson: true });
    setCropParcels([]);
  }, [geojsonPreview]);

  // ── Apufunktiot ───────────────────────────────────────────────────────────

  const getCropColor = (kasvikoodi: string): string => {
    if (cropColorMap.has(kasvikoodi)) return cropColorMap.get(kasvikoodi)!;
    let hash = 0;
    for (const char of kasvikoodi) hash = char.charCodeAt(0) + ((hash << 5) - hash);
    return `hsl(${Math.abs(hash) % 360}, 65%, 55%)`;
  };

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

  const fetchFieldInfo = async (geometry: object) => {
    setFieldInfo(null);
    setFieldInfoLoading(true);
    try {
      const res = await apiClient.post<FieldInfo>('/api/fields/info', { geometry });
      setFieldInfo(res.data);
      setCustomName(res.data.name || '');
    } catch {
    } finally {
      setFieldInfoLoading(false);
    }
  };

  // ── Handlerit ─────────────────────────────────────────────────────────────

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

  const handleGeojsonChange = (val: string) => {
    setGeojsonText(val);
    setGeojsonPreview(null);
    setFoundField(null);
    setGeojsonError('');
    clearTimeout((window as any).__geojsonTimer);
    (window as any).__geojsonTimer = setTimeout(() => validateAndPreview(val, true), 600);
  };

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

  const handleSelectAll = async () => {
    if (bboxActive) {
      setBboxFields([]);
      setBboxActive(false);
      setFoundField(null);
      setCropParcels([]);
      return;
    }
    if (!mapRef.current) return;
    try {
      const res = await apiClient.get('/api/fields/by-bbox', {
        params: {
          minLat: mapRef.current.getBounds().getSouth(),
          maxLat: mapRef.current.getBounds().getNorth(),
          minLon: mapRef.current.getBounds().getWest(),
          maxLon: mapRef.current.getBounds().getEast(),
        },
      });
      setBboxFields(res.data);
      setBboxActive(true);
      setFoundField(null);
      setCropParcels([]);
    } catch {
      setClickError('Hakuvirhe');
    }
  };

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
      endDate,
      name,
      cropParcels,
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
    setCurrentZoom(5);
    setBboxFields([]);
    setBboxActive(false);
    onClose();
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const stepContent = [
    <Step1Area
      searchText={searchText}
      setSearchText={setSearchText}
      onSearch={handleSearch}
      searching={searching}
      searchError={searchError}
      geojsonPanelOpen={geojsonPanelOpen}
      setGeojsonPanelOpen={setGeojsonPanelOpen}
      geojsonText={geojsonText}
      setGeojsonText={setGeojsonText}
      geojsonError={geojsonError}
      geojsonValidating={geojsonValidating}
      geojsonPreview={geojsonPreview}
      onGeojsonChange={handleGeojsonChange}
      onFileChange={handleFileChange}
      currentZoom={currentZoom}
      bboxActive={bboxActive}
      onSelectAll={handleSelectAll}
      mapCenter={mapCenter}
      mapBounds={mapBounds}
      mapRef={mapRef}
      foundField={foundField}
      cropParcels={cropParcels}
      bboxFields={bboxFields}
      onMapClick={handleMapClick}
      onZoomChange={setCurrentZoom}
      onBboxFieldClick={setFoundField}
      getCropColor={getCropColor}
      clicking={clicking}
      clickError={clickError}
    />,
    <Step2Settings
      fieldInfo={fieldInfo}
      fieldInfoLoading={fieldInfoLoading}
      customName={customName}
      setCustomName={setCustomName}
      startDate={startDate}
      setStartDate={setStartDate}
      endDate={endDate}
      noDataFound={noDataFound}
      submitError={submitError}
    />,
    <Step3Loading fetchError={fetchError} onBack={handleBack} />,
  ][activeStep];

  return (
    <Dialog
      open={open}
      onClose={activeStep === 2 ? undefined : handleClose}
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
                : <Button size="small" variant="contained" onClick={handleSubmit} disabled={imagesLoading}>
                    {t('fetchNdviImages') || 'Hae kuvat'}
                  </Button>
            }
          />
        ) : (
          <DialogActions sx={{ px: 3, py: 2 }}>
            {activeStep === 0 ? (
              <>
                <Button onClick={handleClose}>{t('cancel')}</Button>
                <Button variant="contained" disabled={!foundField} onClick={handleNext} endIcon={<KeyboardArrowRightIcon />}>
                  {t('next')}
                </Button>
              </>
            ) : (
              <>
                <Button onClick={handleBack} startIcon={<KeyboardArrowLeftIcon />}>
                  {t('back')}
                </Button>
                <Button variant="contained" onClick={handleSubmit} disabled={imagesLoading}>
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