import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box, Typography, Paper, List, ListItem,
  ListItemText, CircularProgress, Alert, Chip, Divider,
  ToggleButton, ToggleButtonGroup, Tooltip, IconButton, Collapse,
} from '@mui/material';
import GrassIcon from '@mui/icons-material/Grass';
import ViewSidebarIcon from '@mui/icons-material/ViewSidebar';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import ViewAgendaIcon from '@mui/icons-material/ViewAgenda';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useFieldsStore } from '../store/fieldsStore';
import NdviMapViewer from '../components/ndvi/NdviMapViewer';
import NdviMapViewerA from '../components/ndvi/NdviMapViewerA';
import NdviMapViewerC from '../components/ndvi/NdviMapViewerC';

type ViewMode = 'A' | 'B' | 'C';

const VIEW_OPTIONS: { value: ViewMode; icon: React.ReactNode; tooltip: string }[] = [
  { value: 'A', icon: <FullscreenIcon fontSize="small" />, tooltip: 'A — Koko ruutu + overlay' },
  { value: 'B', icon: <ViewSidebarIcon fontSize="small" />, tooltip: 'B — Split: kartta + info' },
  { value: 'C', icon: <ViewAgendaIcon fontSize="small" />, tooltip: 'C — Kortit allekkain' },
];

export default function FieldsPage() {
  const location = useLocation();
  const fromGeoJson = location.state?.fromGeoJson as boolean | undefined;

  //const { fields, loading, error, fetched, fetchFields, selectedFieldId, setSelectedField } =useFieldsStore();
  const {
    fields,
    fieldsLoading: loading,
    fieldsError: error,
    fieldsFetched: fetched,
    fetchFields,
    selectedFieldId,
    setSelectedField
  } = useFieldsStore();

  const [viewMode, setViewMode] = useState<ViewMode>('B');
  const [listOpen, setListOpen] = useState(true);

  useEffect(() => { fetchFields(); }, [fetchFields]);
  /*
    const handleSelectField = (id: string) => {
      setSelectedField(id);
      if (window.innerWidth < 900) setListOpen(false);
    };
  */
  const handleSelectField = (id: string) => {
    setSelectedField(id);
    setListOpen(false);  // ← poistetaan if-ehto, sulkeutuu aina
  };

  const selectedField = fields.find((f) => f.id === selectedFieldId);

  //console.log('selectedField:', selectedField);
  // console.log('sentinelid välitetään:', selectedField?.id);

  const renderViewer = () => {
    if (!selectedField) return null;
    const props = { sentinelid: selectedField.id, fieldName: selectedField.name };
    if (viewMode === 'A') return <NdviMapViewerA {...props} />;
    if (viewMode === 'C') return <NdviMapViewerC {...props} />;
    return <NdviMapViewer {...props} />;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, height: '100%' }}>

      {/* ─── Lohkolista + collapse-toggle ─── */}
      <Box sx={{ display: 'flex', flexDirection: 'row', flexShrink: 0 }}>
        <Collapse in={listOpen} orientation="horizontal" timeout={200}>
          <Paper sx={{ width: 240, display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <GrassIcon color="primary" fontSize="small" />
              <Typography fontWeight={700}>Lohkot</Typography>
              {fetched && (
                <Chip label={fields.length} size="small" color="primary" variant="outlined" sx={{ ml: 'auto' }} />
              )}
            </Box>
            <Divider />

            {/* GeoJSON-haun tulos */}
            {fromGeoJson && (
              <Alert severity="success" sx={{ m: 1, py: 0.5 }}>
                Uusi lohko lisätty
              </Alert>
            )}

            {loading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} /></Box>}
            {error && <Alert severity="error" sx={{ m: 1 }}>{error}</Alert>}
            {!loading && !error && fields.length === 0 && (
              <Typography color="text.secondary" sx={{ p: 2 }} variant="body2">
                Ei lohkoja. Lisää GeoJSON-haulla.
              </Typography>
            )}

            <List disablePadding sx={{ overflow: 'auto', flex: 1 }}>
              {fields.map((field, i) => (
                <ListItem key={field.id} disablePadding divider={i < fields.length - 1}>
                  <ListItemText
                    primary={field.name}
                    secondary={field.area ? `${(field.area / 10000).toFixed(2)} ha` : undefined}
                    sx={{
                      px: 2, py: 1.5, cursor: 'pointer',
                      bgcolor: selectedFieldId === field.id ? 'primary.main' : 'transparent',
                      color: selectedFieldId === field.id ? 'white' : 'inherit',
                      '& .MuiListItemText-secondary': {
                        color: selectedFieldId === field.id ? 'rgba(255,255,255,0.7)' : undefined,
                      },
                      transition: 'background 0.15s',
                    }}
                    onClick={() => handleSelectField(field.id)}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Collapse>

        <Tooltip title={listOpen ? 'Piilota lista' : 'Näytä lista'} placement="right">
          <IconButton
            onClick={() => setListOpen((v) => !v)}
            size="small"
            sx={{
              alignSelf: 'center',
              ml: listOpen ? 0.5 : 0,
              bgcolor: 'background.paper',
              border: 1,
              borderColor: 'divider',
              borderRadius: '0 8px 8px 0',
              width: 20,
              height: 48,
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            {listOpen ? <ChevronLeftIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* ─── Karttanäkymä ─── */}
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {selectedField && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {!listOpen && (
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                {selectedField.name}
              </Typography>
            )}
            <Box sx={{ ml: 'auto' }}>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(_, val) => val && setViewMode(val)}
                size="small"
              >
                {VIEW_OPTIONS.map(({ value, icon, tooltip }) => (
                  <Tooltip key={value} title={tooltip}>
                    <ToggleButton value={value}>{icon}</ToggleButton>
                  </Tooltip>
                ))}
              </ToggleButtonGroup>
            </Box>
          </Box>
        )}

        <Box sx={{ flex: 1, minHeight: 0 }}>
          {selectedField ? renderViewer() : (
            <Paper sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box textAlign="center">
                <GrassIcon sx={{ fontSize: 48, color: 'action.disabled', mb: 1 }} />
                <Typography color="text.secondary">Valitse lohko vasemmalta</Typography>
                <Typography variant="caption" color="text.secondary">
                  tai lisää uusi GeoJSON-haulla
                </Typography>
              </Box>
            </Paper>
          )}
        </Box>
      </Box>
    </Box>
  );
}
