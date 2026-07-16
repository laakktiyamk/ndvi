import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box, Typography, Paper, List, ListItem,
  ListItemText, CircularProgress, Alert, Chip, Divider,
  Tooltip, IconButton, Collapse,
} from '@mui/material';
import GrassIcon from '@mui/icons-material/Grass';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useAppStore } from '../store/appStore';
import NdviMapViewer from '../components/ndvi/NdviMapViewer';

import SearchIcon from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';

const today = new Date().toISOString().split('T')[0];

export default function FieldsPage() {
  const location = useLocation();
  const fromGeoJson = location.state?.fromGeoJson as boolean | undefined;

  const {
    fields,
    fieldsLoading: loading,
    fieldsError: error,
    fieldsFetched: fetched,
    fetchFields,
    selectedFieldId,
    setSelectedField,
    fetchImagesForField,
    startDate,
  } = useAppStore();

  const [listOpen, setListOpen] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => { fetchFields(); }, [fetchFields]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSelectField = (id: string) => {
    setSelectedField(id);
    setListOpen(false);
    const field = fields.find((f) => f.id === id);
    if (field) fetchImagesForField(field, startDate, today);
  };

  const selectedField = fields.find((f) => f.id === selectedFieldId);
  const filteredFields = fields.filter(f =>
    f.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  return (
    <Box sx={{
      display: 'flex',
      // Mobiililla (xs): column-layout, lista ensin sitten kartta.
      // Desktopilla (md+): rinnakkain.
      flexDirection: { xs: 'column', md: 'row' },
      gap: 2,
      // Tärkeä: flex:1 + minHeight:0 antaa tämän Boxin täyttää AppLayoutin
      // main-kontainerin (position:fixed, display:flex, flexDirection:column).
      // Ilman tätä height:'100%' ei toimi ja sisältö jää piiloon tai romahtaa.
      flex: 1,
      minHeight: 0,
      // Mobiililla sallitaan scrollaus tässä tasolla koska column-layoutissa
      // sisältö voi olla pidempi kuin viewport.
      overflow: { xs: 'auto', md: 'hidden' },
    }}>

      {/* ─── Lohkolista + collapse-toggle ─── */}
      <Box sx={{
        display: 'flex',
        flexDirection: 'row',
        flexShrink: 0,
        // Mobiililla lista ei saa olla fixed-korkuinen — anna sen olla luonnollisen kokoinen
        // jotta scrollaus toimii oikein column-layoutissa
        height: { md: '100%' },
      }}>
        <Collapse in={listOpen} orientation="horizontal" timeout={200}>
          <Paper sx={{
            width: 240,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            // Desktopilla täytä koko korkeus, mobiililla anna olla joustava
            height: { xs: 'auto', md: '100%' },
            // Mobiililla rajaa listan max-korkeus jotta se ei vie koko ruutua
            maxHeight: { xs: 360, md: 'none' },
          }}>
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <GrassIcon color="primary" fontSize="small" />
              <Typography sx={{ fontWeight: 700 }}>Lohkot</Typography>
              {fetched && (
                <Chip label={fields.length} size="small" color="primary" variant="outlined" sx={{ ml: 'auto' }} />
              )}
            </Box>
            <Divider />

            <Box sx={{ px: 1.5, py: 1 }}>
              <TextField
                size="small"
                fullWidth
                placeholder="Hae lohkoa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Box>

            {fromGeoJson && (
              <Alert severity="success" sx={{ m: 1, py: 0.5 }}>Uusi lohko lisätty</Alert>
            )}
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={24} />
              </Box>
            )}
            {error && <Alert severity="error" sx={{ m: 1 }}>{error}</Alert>}
            {!loading && !error && fields.length === 0 && (
              <Typography color="text.secondary" sx={{ p: 2 }} variant="body2">
                Ei lohkoja. Lisää GeoJSON-haulla.
              </Typography>
            )}

            <List disablePadding sx={{ overflow: 'auto', flex: 1 }}>
              {filteredFields.map((field, i) => (
                <ListItem key={field.id} disablePadding divider={i < filteredFields.length - 1}>
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
      <Box sx={{
        flex: 1,
        minWidth: 0,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}>
        {selectedField && !listOpen && (
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, flexShrink: 0 }}>
            {selectedField.name}
          </Typography>
        )}

        {/* Tämä Box on NdviMapViewerin suora vanhempi.
            flex:1 + minHeight:0 antaa sen kasvaa täyttämään tilan
            mutta ei pakota sitä suuremmaksi kuin saatavilla oleva tila. */}
        <Box sx={{ flex: 1, minHeight: 0 }}>
          {selectedField ? (
            <NdviMapViewer
              fieldId={selectedField.id}
              fieldName={selectedField.name}
              geometry={selectedField.geometry}
            />
          ) : (
            <Paper sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box sx={{ textAlign: 'center' }}>
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
