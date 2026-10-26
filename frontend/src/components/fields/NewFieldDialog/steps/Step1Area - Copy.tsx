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
  onSelectAll: () => void;

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

export default function Step1Area({
  searchText, setSearchText, onSearch, searching, searchError, onMunicipalitySelect,
  geojsonPanelOpen, setGeojsonPanelOpen,
  geojsonText, geojsonError, geojsonValidating, geojsonPreview,
  onGeojsonChange, onFileChange,
  currentZoom, bboxActive, onSelectAll,
  mapCenter, mapBounds, mapRef, municipalityGeometry,
  foundField, cropParcels, bboxFields,
  onMapClick, onZoomChange, onBboxFieldClick, getCropColor,
  clicking, clickError,
}: Step1Props) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [controlsOpen, setControlsOpen] = useState(true);

  // Piilota kontrollit, kun syöte on tuottanut tuloksen
  useEffect(() => {
    if (mapCenter || mapBounds || foundField || geojsonPreview) {
      setControlsOpen(false);
    }
  }, [mapCenter, mapBounds, foundField, geojsonPreview]);

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

        <Box
          sx={{
            position: 'absolute',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            pointerEvents: 'none', // kartta pysyy klikattavana napin ympärillä
          }}
        >
          {currentZoom >= 12 ? (
            <Button
              variant={bboxActive ? 'contained' : 'outlined'}
              color="secondary"
              onClick={onSelectAll}
              sx={{
                pointerEvents: 'auto',
                bgcolor: bboxActive ? undefined : 'background.paper',
                boxShadow: 4,
                '&:hover': { bgcolor: bboxActive ? undefined : 'background.paper' },
              }}
            >
              {bboxActive
                ? t('unselectAllInView') || 'Poista valinnat'
                : t('selectAllInView') || 'Valitse pellot näkymässä'}
            </Button>
          ) : (
            !foundField && !geojsonPreview && (
              <Chip
                label={t('zoomInToSelectFields') || 'Zoomaa lähemmäs nähdäksesi pellot'}
                sx={{ bgcolor: 'background.paper', boxShadow: 4 }}
              />
            )
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
}
