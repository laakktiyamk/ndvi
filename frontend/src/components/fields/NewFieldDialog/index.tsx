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
import { apiClient, getToken } from '../../../api/client';
import { useAppStore } from '../../../store/appStore';
import Step1Area from './steps/Step1Area';
import Step2Settings from './steps/Step2Settings';
import Step3Loading from './steps/Step3Loading';
import type { CropType, FieldInfo, Props } from './types';
import type { ICropParcel } from '../../../types';
import { fetchCropParcelsByGeometry } from '../../../services/cropParcelsService';


import { USE_PIPELINE } from '../../../config';
import { startProcess } from '../../../services/ndviService';
import { useJobProgress } from '../../../hooks/useJobProgress';

import { parseFieldsInput } from '../../../utils/parseFieldsInput';
import type { ParsedField } from '../../../utils/parseFieldsInput';




// Ajaa pyynnöt enintään `limit` kerrallaan ja palauttaa jokaisen tuloksen erikseen
async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, i: number) => Promise<R>
): Promise<PromiseSettledResult<R>[]> {
  const out: PromiseSettledResult<R>[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      try {
        out[i] = { status: 'fulfilled', value: await fn(items[i], i) };
      } catch (reason) {
        out[i] = { status: 'rejected', reason };
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

// Validointipyyntö, jossa tilapäiset virheet uusitaan
const postValidate = async (geometry: object) => {
  for (let attempt = 1; ; attempt++) {
    try {
      return await apiClient.post('/api/validate/geojson', { geometry });
    } catch (e: any) {
      const status = e?.response?.status;
      // 4xx (paitsi 429) on pysyvä virhe, muut uusitaan
      if (attempt >= 3 || (status && status < 500 && status !== 429)) throw e;
      await new Promise((r) => setTimeout(r, 400 * attempt));
    }
  }
};

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
  const [cropParcels, setCropParcels] = useState<ICropParcel[]>([]);
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
  const [geojsonName, setGeojsonName] = useState('');
  const [geojsonFields, setGeojsonFields] = useState<ParsedField[]>([]);
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

  // ── Putki (AWS) ───────────────────────────────────────────────────────────
  const [jobId, setJobId] = useState<string | null>(null);
  const [aoiIds, setAoiIds] = useState<string[]>([]);
  const { job } = useJobProgress(jobId, jobId ? getToken() : null);

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

  const fieldNames: string[] | null =
    foundField?._fromGeojson && geojsonFields.length > 1
      ? geojsonFields.map((f) => f.name ?? '')
      : null;

  // ── Efektit ───────────────────────────────────────────────────────────────

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

  useEffect(() => {
    if (!geojsonPreview) return;
    setFoundField({ geometry: geojsonPreview, _fromGeojson: true });
    setCropParcels([]);

    // Usea pelto (FeatureCollection): kasvulohkot haetaan vasta lähetyksessä
    if (geojsonPreview.type === 'FeatureCollection') return;

    let cancelled = false;
    fetchCropParcelsByGeometry(geojsonPreview)
      .then((parcels) => { if (!cancelled) setCropParcels(parcels); })
      .catch(() => { });
    return () => { cancelled = true; };
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
    setGeojsonName('');
    setGeojsonFields([]);
    if (!text.trim()) return;

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch (err: any) {
      setGeojsonError('Virheellinen JSON: ' + err.message);
      return;
    }

    const parsedFields = parseFieldsInput(parsed);
    if (!parsedFields || parsedFields.length === 0 || parsedFields.some((f) => !f.geometry)) {
      setGeojsonError('Tuntematon muoto: odotetaan geometriaa, { name, geometry } tai { fields: [...] }');
      return;
    }

    setGeojsonValidating(true);
    try {
      const label = (i: number) =>
        parsedFields[i].name ? `#${i + 1} "${parsedFields[i].name}"` : `#${i + 1}`;

      const results = await mapLimit(parsedFields, 4, (f) => postValidate(f.geometry));

      const errors: string[] = [];
      const valid: ParsedField[] = [];
      results.forEach((r, i) => {
        if (r.status === 'rejected') {
          const status = (r.reason as any)?.response?.status;
          errors.push(`${label(i)}: validointipyyntö epäonnistui (${status ?? 'ei vastausta'})`);
        } else if (r.value.data.valid && r.value.data.geometry) {
          valid.push({ geometry: r.value.data.geometry, name: parsedFields[i].name });
        } else {
          errors.push(`${label(i)}: ${(r.value.data.errors ?? []).join(', ') || 'virheellinen geometria'}`);
        }
      });

      if (errors.length > 0) {
        const shown = errors.slice(0, 5).join(' | ');
        setGeojsonError(errors.length > 5 ? `${shown} | ja ${errors.length - 5} muuta` : shown);
        return;
      }

      setGeojsonFields(valid);
      setGeojsonName(valid.length === 1 ? valid[0].name ?? '' : '');

      // Yksi pelto: geometria sellaisenaan. Useampi: FeatureCollection kartalle.
      const preview = valid.length === 1
        ? valid[0].geometry
        : {
          type: 'FeatureCollection',
          features: valid.map((f) => ({
            type: 'Feature',
            properties: { name: f.name ?? '' },
            geometry: f.geometry,
          })),
        };

      setGeojsonPreview(preview);
      const bounds = getGeometryBounds(preview);
      if (bounds) { setMapBounds(bounds); setMapCenter(null); }
      if (autoClose) setGeojsonPanelOpen(false);
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
    setGeojsonName('');
    setGeojsonFields([]);
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
    setGeojsonName('');
    setGeojsonFields([]);
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
      await validateAndPreview(text, true);
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

    if (foundField._fromGeojson && geojsonFields.length > 1) {
      setFieldInfo(null);
      setCustomName('');
    } else if (foundField._fromGeojson && geojsonName) {
      // Nimi annettu syötteessä: ohitetaan sijaintihaku
      setFieldInfo(null);
      setCustomName(geojsonName);
    } else {
      await fetchFieldInfo(foundField.geometry);
    }
    setActiveStep(1);
  };

  const handleBack = () => {
    setActiveStep(0);
    setNoDataFound(false);
    setSubmitError('');
    setFetchError('');
    setJobId(null);
    setAoiIds([]);
  };

  const handleSubmit = async () => {
    if (!foundField) return;
    setNoDataFound(false);
    setSubmitError('');
    setFetchError('');
    setActiveStep(2);

    const name = customName || fieldInfo?.name || '';

    if (USE_PIPELINE) {
      try {
        let payload: { geometry: object; name?: string; kasvulohkot?: ICropParcel[] }[];

        if (foundField._fromGeojson && geojsonFields.length > 1) {
          // Usea pelto: kasvulohkot haetaan enintään 4 kerrallaan
          const parcelResults = await mapLimit(geojsonFields, 4, (f) =>
            fetchCropParcelsByGeometry(f.geometry)
          );
          payload = geojsonFields.map((f, i) => {
            const r = parcelResults[i];
            return {
              geometry: f.geometry,
              name: f.name ?? '',
              kasvulohkot: r.status === 'fulfilled' ? r.value : [],
            };
          });
          const failedParcels = parcelResults.filter((r) => r.status === 'rejected').length;
          if (failedParcels > 0) {
            console.warn(`Kasvulohkohaku epäonnistui ${failedParcels}/${parcelResults.length} pellolle`);
          }
        } else {
          payload = [{ geometry: foundField.geometry, name, kasvulohkot: cropParcels }];
        }

        const res = await startProcess(payload, startDate, endDate);
        setAoiIds(res.aoiIds);
        setJobId(res.jobId);
      } catch {
        setFetchError(t('fetchError') || 'Haku epäonnistui');
      }
      return;
    }

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
    setGeojsonName('');
    setGeojsonFields([]);
    setGeojsonPanelOpen(false);
    setFieldInfo(null);
    setCustomName('');
    setNoDataFound(false);
    setSubmitError('');
    setFetchError('');
    setJobId(null);
    setAoiIds([]);
    setCurrentZoom(5);
    setBboxFields([]);
    setBboxActive(false);
    onClose();
  };

  useEffect(() => {
    if (!jobId || !job || job.status === 'running') return;

    if (job.status === 'failed') {
      setFetchError(
        t('cdseLimitError', {
          defaultValue:
            'Fetching failed. The Copernicus (CDSE) data service may have reached its usage quota or request limit. Please try again later.',
        })
      );
      return;
    }

    const finish = async () => {
      useAppStore.setState({ fieldsFetched: false, activeGeometryHash: null });
      await useAppStore.getState().fetchFields();

      const newField = useAppStore.getState().fields.find((f) => f.id === aoiIds[0]);
      setSelectedField(aoiIds[0]);
      if (newField) {
        await useAppStore.getState().fetchImagesForField(newField, startDate, endDate);
      }

      setNewFieldAdded(true);
      handleClose();
      navigate('/fields');
    };

    void finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job]);

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
      fieldNames={fieldNames}
    />,
    <Step3Loading fetchError={fetchError} onBack={handleBack} progress={job} />

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