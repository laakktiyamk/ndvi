import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Grid, Button,
  Chip, Divider, Alert, CircularProgress, Card, CardActionArea,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import GrassIcon from '@mui/icons-material/Grass';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import BarChartIcon from '@mui/icons-material/BarChart';
import MapIcon from '@mui/icons-material/Map';
import AddIcon from '@mui/icons-material/Add';
import { useAppStore } from '../store/appStore';
import { getNdviStatus } from '../utils/ndviStatus';
import WeatherSummaryPanel from '../components/dashboard/WeatherSummaryPanel';

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString('fi-FI', { day: 'numeric', month: 'numeric', year: 'numeric' });

const CURRENT_YEAR = new Date().getFullYear();

const NAV_CARDS = [
  { labelKey: 'fields',   descKey: 'navFieldsDesc',   path: '/fields',   icon: <GrassIcon sx={{ fontSize: 36 }} color="primary" />,    requiresField: false },
  { labelKey: 'weather',  descKey: 'navWeatherDesc',  path: '/weather',  icon: <WbSunnyIcon sx={{ fontSize: 36 }} color="primary" />,  requiresField: true  },
  { labelKey: 'analysis', descKey: 'navAnalysisDesc', path: '/analysis', icon: <BarChartIcon sx={{ fontSize: 36 }} color="primary" />, requiresField: true  },
  { labelKey: 'geojson',  descKey: 'navGeojsonDesc',  path: '/geojson',  icon: <MapIcon sx={{ fontSize: 36 }} color="primary" />,      requiresField: false },
];

export default function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    fields, fieldsFetched, fieldsLoading,
    selectedFieldId, fetchFields,
    ndviEntries, weatherData, weatherLoading,
    activeGeometryHash,
  } = useAppStore();

  useEffect(() => { fetchFields(); }, [fetchFields]);

  const selectedField = fields.find(f => f.id === selectedFieldId);
  const hasField = Boolean(selectedFieldId);
  const hasData = activeGeometryHash === selectedFieldId && ndviEntries.length > 0;

  const sorted = hasData
    ? [...ndviEntries].sort((a, b) => new Date(b.generationtime).getTime() - new Date(a.generationtime).getTime())
    : [];
  const latestEntry = sorted[0] ?? null;
  const prevEntry = sorted[1] ?? null;
  const trend = latestEntry && prevEntry ? latestEntry.stats.average - prevEntry.stats.average : null;
  const status = latestEntry ? getNdviStatus(latestEntry.stats.average, t) : null;

  const totalArea = fields.reduce((s, f) => s + (f.area ?? 0), 0);

  if (!fieldsLoading && fieldsFetched && fields.length === 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <PageHeader />
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <GrassIcon sx={{ fontSize: 56, color: 'action.disabled', mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 1 }}>{t('noFields')}</Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            {t('addFieldPrompt')}
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/geojson')}>
            {t('addField')}
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <PageHeader />

      <Grid container spacing={2}>
        {NAV_CARDS.map(({ labelKey, descKey, path, icon, requiresField }) => {
          const disabled = requiresField && !hasField;
          return (
            <Grid size={{ xs: 6, sm: 3 }} key={path}>
              <Card elevation={0} variant="outlined" sx={{ height: '100%', opacity: disabled ? 0.45 : 1 }}>
                <CardActionArea
                  disabled={disabled}
                  onClick={() => navigate(path)}
                  sx={{ height: '100%', p: 2, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
                >
                  {icon}
                  <Typography sx={{ fontWeight: 600, mt: 1 }}>{t(labelKey)}</Typography>
                  <Typography variant="caption" color="text.secondary">{t(descKey)}</Typography>
                  {disabled && (
                    <Typography variant="caption" color="warning.main" sx={{ mt: 0.5 }}>
                      {t('selectFieldFirst')}
                    </Typography>
                  )}
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {fieldsLoading ? <CircularProgress size={20} /> : (
        <Grid container spacing={2}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary">{t('fieldCount')}</Typography>
              <Typography sx={{ fontWeight: 700, fontSize: '1.75rem' }}>{fields.length}</Typography>
              <Typography variant="caption" color="text.secondary">kpl</Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary">{t('totalArea')}</Typography>
              <Typography sx={{ fontWeight: 700, fontSize: '1.75rem' }}>
                {(totalArea / 10000).toFixed(1)}
              </Typography>
              <Typography variant="caption" color="text.secondary">ha</Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      {!selectedField ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <GrassIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
          <Typography variant="body1" sx={{ mb: 1 }}>{t('noFieldSelected')}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('selectFieldPrompt')}
          </Typography>
          <Button variant="outlined" onClick={() => navigate('/fields')}>{t('openFields')}</Button>
        </Paper>
      ) : (
        <Paper sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <GrassIcon color="primary" fontSize="small" />
              <Typography sx={{ fontWeight: 600 }}>{selectedField.name}</Typography>
              {selectedField.area && (
                <Typography variant="caption" color="text.secondary">
                  {(selectedField.area / 10000).toFixed(2)} ha
                </Typography>
              )}
            </Box>
            <Button size="small" onClick={() => navigate('/fields')}>{t('open')}</Button>
          </Box>

          {!hasData ? (
            <Alert severity="info">{t('openFieldFirst')}</Alert>
          ) : latestEntry && (
            <>
              <Divider sx={{ mb: 1.5 }} />
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="caption" color="text.secondary">{t('latestNdvi')}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: status?.color }} />
                    <Typography sx={{ fontWeight: 700, fontSize: '1.5rem', color: status?.color }}>
                      {latestEntry.stats.average.toFixed(3)}
                    </Typography>
                    <Chip label={status?.label} size="small"
                      sx={{ bgcolor: status?.color, color: '#fff', fontWeight: 600 }} />
                  </Box>
                  <Typography variant="caption" color="text.secondary">{fmt(latestEntry.generationtime)}</Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="caption" color="text.secondary">{t('trend')}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                    {trend === null ? <Typography color="text.secondary">—</Typography>
                      : trend > 0.02 ? <><TrendingUpIcon sx={{ color: '#2E7D32' }} /><Typography sx={{ color: '#2E7D32', fontWeight: 600 }}>+{trend.toFixed(3)}</Typography></>
                      : trend < -0.02 ? <><TrendingDownIcon sx={{ color: '#C62828' }} /><Typography sx={{ color: '#C62828', fontWeight: 600 }}>{trend.toFixed(3)}</Typography></>
                      : <><TrendingFlatIcon color="action" /><Typography color="text.secondary">{trend.toFixed(3)}</Typography></>
                    }
                  </Box>
                  {prevEntry && <Typography variant="caption" color="text.secondary">vs. {fmt(prevEntry.generationtime)}</Typography>}
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="caption" color="text.secondary">{t('measurements')}</Typography>
                  <Typography sx={{ fontWeight: 700, fontSize: '1.5rem', mt: 0.5 }}>{ndviEntries.length}</Typography>
                  <Typography variant="caption" color="text.secondary">{t('satelliteImages')}</Typography>
                </Grid>
              </Grid>
            </>
          )}
        </Paper>
      )}

      {hasData && (
        <Paper sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <ThermostatIcon color="primary" fontSize="small" />
            <Typography sx={{ fontWeight: 600 }}>
              {t('growingSeason', { year: CURRENT_YEAR })}
            </Typography>
            <Typography variant="caption" color="text.secondary">{t('growingSeasonNote')}</Typography>
          </Box>

          <WeatherSummaryPanel
            weatherData={weatherData}
            weatherLoading={weatherLoading}
            year={CURRENT_YEAR}
          />
        </Paper>
      )}
    </Box>
  );
}

function PageHeader() {
  const { t } = useTranslation();
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <DashboardIcon color="primary" />
      <Typography variant="h5" sx={{ fontWeight: 700 }}>{t('dashboard')}</Typography>
    </Box>
  );
}
