import { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Button, TextField, CircularProgress, Alert,
  Chip, Stack, Collapse, IconButton, Divider, Typography,
} from '@mui/material';

import Fab from '@mui/material/Fab';
import TuneIcon from '@mui/icons-material/Tune';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

import SearchIcon from '@mui/icons-material/Search';
import CodeIcon from '@mui/icons-material/Code';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CloseIcon from '@mui/icons-material/Close';
import NewFieldMap from '../NewFieldMap';
import type { ICropParcel, IMunicipalityListItem } from '../../../../types';
import MunicipalitySearch from './MunicipalitySearch';
interface Step1Props {
  searchText: string;
  setSearchText: (v: string) => void;
  onSearch: () => void;
  searching: boolean;
  searchError: string;
  onMunicipalitySelect: (municipality: IMunicipalityListItem) => void;

  geojsonPanelOpen: boolean;
  setGeojsonPanelOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
  geojsonText: string;
  setGeojsonText: (v: string) => void;
  geojsonError: string;
  geojsonValidating: boolean;
  geojsonPreview: any | null;
  onGeojsonChange: (val: string) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;

  currentZoom: number;
  bboxActive: boolean;
  onSelectAll: () => Promise<number | null>;
  bboxLoading: boolean;

  mapCenter: [number, number] | null;
  mapBounds: [[number, number], [number, number]] | null;
  municipalityGeometry?: GeoJSON.Polygon | GeoJSON.MultiPolygon | null;
  mapRef: React.MutableRefObject<any>;
  foundField: any | null;
  cropParcels: ICropParcel[];
  bboxFields: any[];
  onMapClick: (lat: number, lon: number) => void;
  onZoomChange: (zoom: number) => void;
  onBboxFieldClick: (field: any) => void;
  getCropColor: (kasvikoodi: string) => string;

  clicking: boolean;
  clickError: string;

}

const MIN_ZOOM_FOR_FIELDS = 14

export default function Step1Area({
  searchText, setSearchText, onSearch, searching, searchError, onMunicipalitySelect,
  geojsonPanelOpen, setGeojsonPanelOpen,
  geojsonText, geojsonError, geojsonValidating, geojsonPreview,
  onGeojsonChange, onFileChange,
  currentZoom, bboxActive, bboxLoading, onSelectAll,
  mapCenter, mapBounds, mapRef, municipalityGeometry,
  foundField, cropParcels, bboxFields,
  onMapClick, onZoomChange, onBboxFieldClick, getCropColor,
  
  clicking, clickError,
}: Step1Props) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [controlsOpen, setControlsOpen] = useState(true);
  const [fieldsBtnHidden, setFieldsBtnHidden] = useState(true);

  console.log('currentZoom', currentZoom);

  // Piilota kontrollit, kun syöte on tuottanut tuloksen
  useEffect(() => {
    if (mapCenter || mapBounds || foundField || geojsonPreview) {
      setControlsOpen(false);
    }
  }, [mapCenter, mapBounds, foundField, geojsonPreview]);

  useEffect(() => {
    setFieldsBtnHidden(true);
  }, [mapCenter, mapBounds]);

  return (
    <>
      <Box sx={{ position: 'relative', flex: 1, minHeight: 0 }}>
        <Box sx={{ position: 'absolute', inset: 0 }}>
          <NewFieldMap
            mapCenter={mapCenter}
            mapBounds={mapBounds}
            municipalityGeometry={municipalityGeometry}
            mapRef={mapRef}
            foundField={foundField}
            geojsonPreview={geojsonPreview}
            cropParcels={cropParcels}
            bboxFields={bboxFields}
            geojsonPanelOpen={geojsonPanelOpen}
            onMapClick={onMapClick}
            onZoomChange={onZoomChange}
            onBboxFieldClick={onBboxFieldClick}
            getCropColor={getCropColor}
            onUserInteract={() => setFieldsBtnHidden(false)}
          />
        </Box>

        {!controlsOpen && (
          <Fab
            size="small"
            color="primary"
            onClick={() => setControlsOpen(true)}
            sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1000 }}
          >
            <TuneIcon />
          </Fab>
        )}

        {(() => {
          
          return (
            <Box
              sx={{
                position: 'absolute',
                bottom: 24,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1000,
                pointerEvents: 'none',
              }}
            >
              {currentZoom >= MIN_ZOOM_FOR_FIELDS ? (
                !fieldsBtnHidden && (
                  <Button
                    variant={bboxActive ? 'contained' : 'outlined'}
                    color="secondary"
                    disabled={bboxLoading}
                    startIcon={bboxLoading ? <CircularProgress size={16} color="inherit" /> : undefined}
                    onClick={async () => {
                      const count = await onSelectAll();
                      if (count === 0) setFieldsBtnHidden(true); // ei peltoja: piilota kunnes karttaa liikutetaan
                    }}
                    sx={{
                      pointerEvents: 'auto',
                      bgcolor: bboxActive ? undefined : 'background.paper',
                      boxShadow: 4,
                      '&:hover': { bgcolor: bboxActive ? undefined : 'background.paper' },
                    }}
                  >
                    {bboxActive ? t('hideFieldsInView') : t('showFieldsInView')}
                  </Button>
                )
              ) : (
                !foundField && !geojsonPreview && (
                  <Chip
                    label={t('zoomInToSelectFields')}
                    sx={{ bgcolor: 'background.paper', boxShadow: 4 }}
                  />
                )
              )}
            </Box>
          );
        })()}
        <Box
          sx={{
            position: 'absolute',
            left: 8,
            bottom: 72,
            maxWidth: 'min(480px, calc(100% - 16px))',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 0.5,
            pointerEvents: 'none',
          }}
        >
          {clicking && (
            <Chip
              icon={<CircularProgress size={14} />}
              label={t('searchingField')}
              sx={{ bgcolor: 'background.paper', boxShadow: 4 }}
            />
          )}
          {clickError && (
            <Alert severity="info" sx={{ py: 0, boxShadow: 4, pointerEvents: 'auto' }}>
              {clickError}
            </Alert>
          )}
          {foundField && (
            <Alert severity="success" sx={{ py: 0, boxShadow: 4, pointerEvents: 'auto' }}>
              {foundField._fromGeojson ? t('geojsonReady') : t('fieldFound')}
              {foundField.peruslohkotunnus && (
                <Typography variant="caption" sx={{ display: 'block' }}>
                  {foundField.peruslohkotunnus} · {foundField.pinta_ala} ha
                </Typography>
              )}
            </Alert>
          )}
          {!clicking && !clickError && !foundField && currentZoom >= MIN_ZOOM_FOR_FIELDS && (
            <Chip
              label={geojsonPanelOpen ? t('geojsonPanelHint') : t('clickFieldPrompt')}
              sx={{ bgcolor: 'background.paper', boxShadow: 4 }}
            />
          )}
          {cropParcels.length > 0 && (
            <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
              {cropParcels.map((cp) => (
                <Chip
                  key={cp.tunnus}
                  size="small"
                  label={`${cp.lohkonumero} · ${t(`crop:${cp.kasvikoodi}`)} · ${cp.pinta_ala} ha${cp.luomuviljely === '1' ? ' 🌿' : ''}`}
                  sx={{ backgroundColor: getCropColor(cp.kasvikoodi), color: '#000', fontWeight: 500, boxShadow: 2 }}
                />
              ))}
            </Stack>
          )}
        </Box>

        <Collapse
          in={controlsOpen}
          sx={{ position: 'absolute', top: 8, left: 8, right: 8, zIndex: 1000 }}
        >
          <Box
            sx={{
              maxHeight: 'calc(100vh - 220px)',
              overflowY: 'auto',
              bgcolor: 'background.paper',
              borderRadius: 2,
              boxShadow: 4,
            }}
          >
            <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder={t('searchPlaceholder')}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                />
                <Button
                  variant="contained"
                  onClick={onSearch}
                  disabled={searching || !searchText.trim()}
                  startIcon={searching ? <CircularProgress size={16} /> : <SearchIcon />}
                >
                  {t('search')}
                </Button>
                <IconButton size="small" onClick={() => setControlsOpen(false)}>
                  <KeyboardArrowUpIcon />
                </IconButton>
              </Box>

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
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
                  onChange={onFileChange}
                />
                <MunicipalitySearch onSelect={onMunicipalitySelect} />
              </Box>
            </Box>

            {searchError && (
              <Box sx={{ px: 1.5, pb: 1 }}>
                <Alert severity="warning">{searchError}</Alert>
              </Box>
            )}

            <Collapse in={geojsonPanelOpen}>
              <Box sx={{ px: 1.5, pb: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
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
                  onChange={(e) => onGeojsonChange(e.target.value)}
                  placeholder={'{ "type": "Polygon" | "MultiPolygon", "coordinates": [...] }\n\nor\n\n{ "name": "Field 1", "geometry": { ... } }'}
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
                    <Typography variant="caption" color="text.secondary">{t('validating')}</Typography>
                  </Box>
                )}
              </Box>
            </Collapse>
          </Box>
        </Collapse>
      </Box>

    </>
  );
}
