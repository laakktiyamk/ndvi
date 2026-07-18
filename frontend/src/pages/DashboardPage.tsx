import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Grid, Button,
  Chip, Divider, Alert, CircularProgress, Card, CardContent, CardActionArea,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import GrassIcon from '@mui/icons-material/Grass';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import BarChartIcon from '@mui/icons-material/BarChart';
import MapIcon from '@mui/icons-material/Map';
import AddIcon from '@mui/icons-material/Add';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useAppStore } from '../store/appStore';

const NDVI_STATUS = (v: number) => {
  if (v >= 0.6) return { label: 'Erinomainen', color: '#2E7D32' };
  if (v >= 0.4) return { label: 'Hyvä', color: '#689F38' };
  if (v >= 0.2) return { label: 'Kohtalainen', color: '#F9A825' };
  return { label: 'Heikko', color: '#C62828' };
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString('fi-FI', { day: 'numeric', month: 'numeric', year: 'numeric' });

const fmtShort = (iso: string) => {
  const d = new Date(iso);
  return `${d.getDate()}.${d.getMonth() + 1}.`;
};

const calcGDD = (tMax: number | null, tMin: number | null): number => {
  if (tMax == null || tMin == null) return 0;
  return Math.max(0, (tMax + tMin) / 2 - 5);
};

const CURRENT_YEAR = new Date().getFullYear();

// ── Navigointikortit ─────────────────────────────────────────────────────────
const NAV_CARDS = [
  { label: 'Lohkot',       desc: 'Hallitse ja tarkastele peltolohkoja', path: '/fields',   icon: <GrassIcon sx={{ fontSize: 36 }} color="primary" />,    requiresField: false },
  { label: 'Sää',          desc: 'Säädata ja kasvukauden tilastot',      path: '/weather',  icon: <WbSunnyIcon sx={{ fontSize: 36 }} color="primary" />,  requiresField: true  },
  { label: 'Analyysi',     desc: 'NDVI-trendit ja ennusteet',            path: '/analysis', icon: <BarChartIcon sx={{ fontSize: 36 }} color="primary" />, requiresField: true  },
  { label: 'GeoJSON-haku', desc: 'Lisää uusi lohko koordinaateilla',    path: '/geojson',  icon: <MapIcon sx={{ fontSize: 36 }} color="primary" />,      requiresField: false },
];

export default function DashboardPage() {
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
  const status = latestEntry ? NDVI_STATUS(latestEntry.stats.average) : null;

  const totalArea = fields.reduce((s, f) => s + (f.area ?? 0), 0);

  const seasonStart = new Date(CURRENT_YEAR, 4, 1);
  const weatherThisYear = weatherData
    .filter(w => { const d = new Date(w.date); return d.getFullYear() === CURRENT_YEAR && d >= seasonStart; })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let cumGDD = 0, cumRain = 0;
  const cumulativeData = weatherThisYear.map(w => {
    cumGDD += calcGDD(w.temperature_2m_max, w.temperature_2m_min);
    cumRain += w.precipitation_sum ?? 0;
    return { label: fmtShort(w.date), gdd: Math.round(cumGDD), rain: Math.round(cumRain * 10) / 10 };
  });

  if (!fieldsLoading && fieldsFetched && fields.length === 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <PageHeader />
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <GrassIcon sx={{ fontSize: 56, color: 'action.disabled', mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 1 }}>Ei lohkoja vielä</Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Lisää ensimmäinen lohko GeoJSON-haulla aloittaaksesi seurannan.
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/geojson')}>
            Lisää lohko
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <PageHeader />

      {/* ── Navigointikortit ── */}
      <Grid container spacing={2}>
        {NAV_CARDS.map(({ label, desc, path, icon, requiresField }) => {
          const disabled = requiresField && !hasField;
          return (
            <Grid size={{ xs: 6, sm: 3 }} key={path}>
              <Card
                elevation={0}
                variant="outlined"
                sx={{ height: '100%', opacity: disabled ? 0.45 : 1 }}
              >
                <CardActionArea
                  disabled={disabled}
                  onClick={() => navigate(path)}
                  sx={{ height: '100%', p: 2, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
                >
                  {icon}
                  <Typography sx={{ fontWeight: 600, mt: 1 }}>{label}</Typography>
                  <Typography variant="caption" color="text.secondary">{desc}</Typography>
                  {disabled && (
                    <Typography variant="caption" color="warning.main" sx={{ mt: 0.5 }}>
                      Valitse ensin lohko
                    </Typography>
                  )}
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* ── Lohkojen yhteenveto ── */}
      {fieldsLoading ? <CircularProgress size={20} /> : (
        <Grid container spacing={2}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary">Lohkoja</Typography>
              <Typography sx={{ fontWeight: 700, fontSize: '1.75rem' }}>{fields.length}</Typography>
              <Typography variant="caption" color="text.secondary">kpl</Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary">Yhteispinta-ala</Typography>
              <Typography sx={{ fontWeight: 700, fontSize: '1.75rem' }}>
                {(totalArea / 10000).toFixed(1)}
              </Typography>
              <Typography variant="caption" color="text.secondary">ha</Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* ── Valittu lohko ── */}
      {!selectedField ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <GrassIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
          <Typography variant="body1" sx={{ mb: 1 }}>Ei lohkoa valittuna</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Valitse lohko nähdäksesi NDVI-tiedot ja kasvukauden tilastot.
          </Typography>
          <Button variant="outlined" onClick={() => navigate('/fields')}>Avaa lohkot</Button>
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
            <Button size="small" onClick={() => navigate('/fields')}>Avaa →</Button>
          </Box>

          {!hasData ? (
            <Alert severity="info">
              Avaa lohko Lohkot-sivulta ladataksesi NDVI-data.
            </Alert>
          ) : latestEntry && (
            <>
              <Divider sx={{ mb: 1.5 }} />
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="caption" color="text.secondary">Viimeisin NDVI</Typography>
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
                  <Typography variant="caption" color="text.secondary">Trendi</Typography>
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
                  <Typography variant="caption" color="text.secondary">Mittauksia</Typography>
                  <Typography sx={{ fontWeight: 700, fontSize: '1.5rem', mt: 0.5 }}>{ndviEntries.length}</Typography>
                  <Typography variant="caption" color="text.secondary">satelliittikuvaa</Typography>
                </Grid>
              </Grid>
            </>
          )}
        </Paper>
      )}

      {/* ── Kasvukauden lämpösumma + sade ── */}
      {hasData && (
        <Paper sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <ThermostatIcon color="primary" fontSize="small" />
            <Typography sx={{ fontWeight: 600 }}>
              Kasvukausi {CURRENT_YEAR} — lämpösumma & sade
            </Typography>
            <Typography variant="caption" color="text.secondary">(1.5. alkaen, kynnys +5°C)</Typography>
          </Box>

          {weatherLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress size={24} /></Box>
          ) : cumulativeData.length === 0 ? (
            <Typography color="text.secondary" variant="body2">Säädataa ei saatavilla tälle kaudelle.</Typography>
          ) : (
            <>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs: 6 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <ThermostatIcon fontSize="small" sx={{ color: '#C62828' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Lämpösumma</Typography>
                      <Typography sx={{ fontWeight: 700 }}>{cumulativeData[cumulativeData.length - 1]?.gdd ?? 0} °C·vrk</Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <WaterDropIcon fontSize="small" sx={{ color: '#1565C0' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Sade yhteensä</Typography>
                      <Typography sx={{ fontWeight: 700 }}>{cumulativeData[cumulativeData.length - 1]?.rain ?? 0} mm</Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={cumulativeData} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis yAxisId="gdd" tick={{ fontSize: 10 }} width={40} tickFormatter={v => `${v}°`} />
                  <YAxis yAxisId="rain" orientation="right" tick={{ fontSize: 10 }} width={36} tickFormatter={v => `${v}mm`} />
                  <Tooltip formatter={(v, name) => name === 'gdd' ? [`${v} °C·vrk`, 'Lämpösumma'] : [`${v} mm`, 'Sade']} />
                  <Legend formatter={v => v === 'gdd' ? 'Lämpösumma' : 'Sade'} />
                  <Line yAxisId="gdd" type="monotone" dataKey="gdd" stroke="#C62828" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line yAxisId="rain" type="monotone" dataKey="rain" stroke="#1565C0" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </>
          )}
        </Paper>
      )}
    </Box>
  );
}

function PageHeader() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <DashboardIcon color="primary" />
      <Typography variant="h5" sx={{ fontWeight: 700 }}>Dashboard</Typography>
    </Box>
  );
}
