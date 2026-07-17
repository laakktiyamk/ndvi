import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box, Typography, Paper, List, ListItem,
  ListItemText, CircularProgress, Alert, Chip, Divider,
  Tooltip, IconButton, Collapse, useMediaQuery, useTheme,
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSelectField = (id: string) => {
    setSelectedField(id);
    setListOpen(false);
    const field = fields.find((f) => f.id === id);
    if (field) {
      fetchImagesForField(field, startDate, today);
    }
  };

  const selectedField = fields.find((f) => f.id === selectedFieldId);


  const filteredFields = fields.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()));

  // KORJAUS: Mobiilissa lista ja kartta eivät enää ole aina molemmat DOM:issa
  // pystysuunnassa pinottuna (mikä pakotti käyttäjän scrollaamaan nähdäkseen
  // kartan). Sen sijaan näytetään ehdollisesti vain toinen kerrallaan, ja se
  // täyttää aina koko käytettävissä olevan korkeuden. Työpöydällä (md+)
  // molemmat renderöidään aina rinnakkain kuten ennenkin.
  const showList = !isMobile || listOpen;
  const showMap = !isMobile || !listOpen;

  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, height: '100%', minHeight: 0 }}>

      {/* ─── Lohkolista + collapse-toggle ─── */}
      {showList && (
        <Box sx={{
          display: 'flex',
          flexDirection: 'row',
          flexShrink: 0,
          // Mobiilissa lista on ainoa näkyvä elementti kun se on auki,
          // joten se saa täyden korkeuden. Työpöydällä korkeus tulee
          // sisällöstä/Paperista kuten ennen.
          height: { xs: '100%', md: 'auto' },
          minHeight: 0,
        }}>
          <Collapse in={listOpen} orientation="horizontal" timeout={200} sx={{ height: '100%' }}>
            <Paper sx={{
              // Mobiilissa lista vie koko leveyden (ei kapeaa 240px-palkkia
              // pienellä ruudulla), työpöydällä pysyy kiinteänä sivupalkkina.
              width: { xs: '100%', md: 240 },
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              height: '100%',
            }}>
              <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <GrassIcon color="primary" fontSize="small" />
                <Typography sx={{ fontWeight: 700 }}>Lohkot</Typography>
                {fetched && (
                  <Chip label={fields.length} size="small" color="primary" variant="outlined" sx={{ ml: 'auto' }} />
                )}
              </Box>
              <Divider />

              {/* Search */}
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

          {/* Toggle-nappi vain työpöydällä listan reunassa. Mobiilissa lista
              voi olla kokonaan poissa DOM:ista kun se on kiinni, joten sen
              avaaminen hoidetaan kartan puolen "Näytä lohkolista" -napista
              (ks. alempana showMap-lohko). */}
          {!isMobile && (
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
          )}
        </Box>
      )}

      {/* ─── Karttanäkymä ─── */}
      {showMap && (
        <Box sx={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          // Mobiilissa kartta on ainoa näkyvä elementti kun lista on kiinni,
          // joten se saa täyden korkeuden.
          height: { xs: '100%', md: 'auto' },
        }}>
          {selectedField && !listOpen && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {isMobile && (
                <Tooltip title="Näytä lohkolista">
                  <IconButton
                    onClick={() => setListOpen(true)}
                    size="small"
                    sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}
                    aria-label="Näytä lohkolista"
                  >
                    <GrassIcon fontSize="small" color="primary" />
                  </IconButton>
                </Tooltip>
              )}
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                {selectedField.name}
              </Typography>
            </Box>
          )}

          <Box sx={{ flex: 1, minHeight: 0 }}>
            {selectedField ? (
              <NdviMapViewer
                fieldId={selectedField.id}
                fieldName={selectedField.name}
                geometry={selectedField.geometry}   // ← lisää tämä
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
      )}
    </Box>
  );
}
