import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Box, Tabs, Tab, Paper, Typography, Chip, Divider,
  CircularProgress, Alert, Tooltip,
} from '@mui/material';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import GrassIcon from '@mui/icons-material/Grass';
import AirIcon from '@mui/icons-material/Air';
import OpacityIcon from '@mui/icons-material/Opacity';

// Leaflet – varmista että nämä on asennettu:
// npm install leaflet
// npm install --save-dev @types/leaflet
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { useAppStore } from '../../store/appStore';
import type { MergedNdviEntry } from '../../types';

// ─── Alikomponenttien importit ───────────────────────────────────────────────
// Nämä tulevat omasta projektistasi — varmista polut
import NdviTimelineChart from './NdviTimelineChart';

// ─── Apufunktiot ─────────────────────────────────────────────────────────────

const fmt = (date: string) =>
  new Date(date).toLocaleDateString('fi-FI', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });

const NDVI_COLOR_LABEL = (v: number) => {
  if (v >= 0.6) return { label: 'Erinomainen', color: '#2E7D32' };
  if (v >= 0.4) return { label: 'Hyvä', color: '#689F38' };
  if (v >= 0.2) return { label: 'Kohtalainen', color: '#F9A825' };
  return { label: 'Heikko', color: '#C62828' };
};

// Laske pellon centroidi GeoJSON Polygon/MultiPolygon-geometriasta
function getCentroid(geometry: { type: string; coordinates: unknown[] }): [number, number] | null {
  try {
    if (geometry.type === 'Polygon') {
      const ring = (geometry.coordinates as number[][][])[0];
      const lat = ring.reduce((s, c) => s + c[1], 0) / ring.length;
      const lng = ring.reduce((s, c) => s + c[0], 0) / ring.length;
      return [lat, lng];
    }
    if (geometry.type === 'MultiPolygon') {
      const allPoints = (geometry.coordinates as number[][][][]).flatMap(poly => poly[0]);
      const lat = allPoints.reduce((s, c) => s + c[1], 0) / allPoints.length;
      const lng = allPoints.reduce((s, c) => s + c[0], 0) / allPoints.length;
      return [lat, lng];
    }
  } catch {
    // ei tehdä mitään
  }
  return null;
}

// ─── On Map -välilehti ───────────────────────────────────────────────────────

interface OnMapTabProps {
  entry: MergedNdviEntry;
}

function OnMapTab({ entry }: OnMapTabProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<L.Map | null>(null);
  const overlayRef = useRef<L.ImageOverlay | null>(null);

  const image = entry.image;

  useEffect(() => {
    if (!mapRef.current || !image) return;

    // Bounds: minX=lng_west, minY=lat_south, maxX=lng_east, maxY=lat_north
    const bounds: L.LatLngBoundsExpression = [
      [image.image.minY, image.image.minX], // SW
      [image.image.maxY, image.image.maxX], // NE
    ];

    // Luo kartta jos ei ole
    if (!leafletRef.current) {
      const map = L.map(mapRef.current, {
        zoomControl: true,
        attributionControl: true,
      });

      // Satelliittitile (Esri World Imagery, samat kuin demossa)
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, GeoEye, Earthstar Geographics',
          maxZoom: 19,
        }
      ).addTo(map);

      leafletRef.current = map;
    }

    const map = leafletRef.current;

    // Poista vanha overlay
    if (overlayRef.current) {
      overlayRef.current.remove();
    }

    // Lisää NDVI-kuva imageOverlayna
    const overlay = L.imageOverlay(image.image.dataUrl, bounds, {
      opacity: 0.85,
      interactive: false,
    }).addTo(map);

    overlayRef.current = overlay;

    // Sovita näkymä kuvan alueeseen
    map.fitBounds(bounds, { padding: [20, 20] });

    return () => {
      // Puhdistus kun komponentti unmountataan
      if (leafletRef.current) {
        leafletRef.current.remove();
        leafletRef.current = null;
        overlayRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Päivitä overlay kun entry muuttuu (navigointi)
  useEffect(() => {
    if (!leafletRef.current || !image) return;

    const bounds: L.LatLngBoundsExpression = [
      [image.image.minY, image.image.minX],
      [image.image.maxY, image.image.maxX],
    ];

    if (overlayRef.current) {
      overlayRef.current.setUrl(image.image.dataUrl);
      overlayRef.current.setBounds(L.latLngBounds(bounds));
    }
  }, [entry.sentinelid, image]);

  if (!image) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        Tälle päivälle ei ole kuvaoverlaylle tarvittavia tietoja.
      </Alert>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Päivämäärä-chip */}
      <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary">
          NDVI satelliittikuva kartalla — {fmt(entry.generationtime)}
        </Typography>
      </Box>
      {/* Kartta */}
      <Box
        ref={mapRef}
        sx={{
          flex: 1,
          minHeight: 0,
          '& .leaflet-container': { height: '100%', background: '#1a1a2e' },
        }}
      />
    </Box>
  );
}

// ─── Location -välilehti ─────────────────────────────────────────────────────

interface LocationTabProps {
  geometry: { type: string; coordinates: unknown[] };
  fieldName?: string;
}

function LocationTab({ geometry, fieldName }: LocationTabProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<L.Map | null>(null);

  const centroid = useMemo(() => getCentroid(geometry), [geometry]);

  useEffect(() => {
    if (!mapRef.current || !centroid) return;
    if (leafletRef.current) return; // jo luotu

    const map = L.map(mapRef.current, {
      center: [64.5, 26.0], // Suomen keskipiste
      zoom: 5,
      zoomControl: true,
    });

    // OpenStreetMap-pohjakartta sijainnin näyttöön
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Markkeri
    const marker = L.marker(centroid);
    if (fieldName) {
      marker.bindPopup(`<b>${fieldName}</b>`).openPopup();
    }
    marker.addTo(map);

    leafletRef.current = map;

    return () => {
      if (leafletRef.current) {
        leafletRef.current.remove();
        leafletRef.current = null;
      }
    };
  }, [centroid, fieldName]);

  if (!centroid) {
    return <Alert severity="warning" sx={{ m: 2 }}>Sijaintia ei voitu laskea geometriasta.</Alert>;
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary">
          AOI:n sijainti — {fieldName ?? 'Nimetön alue'}
        </Typography>
      </Box>
      <Box
        ref={mapRef}
        sx={{
          flex: 1,
          minHeight: 0,
          '& .leaflet-container': { height: '100%' },
        }}
      />
    </Box>
  );
}

// ─── Statistics -välilehti ───────────────────────────────────────────────────

interface StatsTabProps {
  entry: MergedNdviEntry;
  weather: ReturnType<typeof useAppStore.getState>['weatherData'][number] | undefined;
}

function StatsTab({ entry, weather }: StatsTabProps) {
  const status = NDVI_COLOR_LABEL(entry.stats.average);
  const image = entry.image;

  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5, overflow: 'auto', height: '100%' }}>
      {/* Tilanne */}
      <Box>
        <Typography variant="caption" color="text.secondary">Tilanne</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: status.color }} />
          <Typography sx={{ fontWeight: 600 }}>{status.label}</Typography>
        </Box>
      </Box>
      <Divider />

      {/* NDVI-arvot */}
      {[
        { label: 'Keskiarvo (Avg)', value: entry.stats.average },
        { label: 'Maksimi (Max)', value: entry.stats.max },
        { label: 'Minimi (Min)', value: entry.stats.min },
        { label: 'Hajonta (Std)', value: entry.stats.std },
      ].map(({ label, value }) => (
        <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">{label}</Typography>
          <Chip
            label={value?.toFixed(2) ?? '—'}
            size="small"
            sx={{ fontWeight: 700, minWidth: 56, justifyContent: 'center' }}
          />
        </Box>
      ))}

      {/* Kasvillisuusjakauma */}
      {image?.scale && image.scale.length > 0 && (
        <>
          <Divider />
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Kasvillisuusjakauma
            </Typography>
            <Box sx={{ display: 'flex', height: 18, borderRadius: 1, overflow: 'hidden', width: '100%' }}>
              {image.scale.map((cls, i) =>
                cls.amount < 0.5 ? null : (
                  <Tooltip key={i} title={`${cls.amount.toFixed(1)}%`} arrow>
                    <Box sx={{ width: `${cls.amount}%`, bgcolor: cls.color, cursor: 'default' }} />
                  </Tooltip>
                )
              )}
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              {image.scale.map((cls, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: cls.color, flexShrink: 0 }} />
                  <Typography variant="caption" color="text.secondary">
                    {cls.amount.toFixed(1)}%
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </>
      )}

      {/* Säätiedot */}
      {weather && (
        <>
          <Divider />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            Säätiedot
          </Typography>
          {[
            { label: 'Keskilämpötila', value: weather.temperature_2m_mean, unit: '°C', icon: <ThermostatIcon fontSize="small" /> },
            { label: 'Lämpötila max', value: weather.temperature_2m_max, unit: '°C', icon: <ThermostatIcon fontSize="small" sx={{ color: '#C62828' }} /> },
            { label: 'Lämpötila min', value: weather.temperature_2m_min, unit: '°C', icon: <ThermostatIcon fontSize="small" sx={{ color: '#1565C0' }} /> },
            { label: 'Kosteus', value: weather.relative_humidity_2m_mean, unit: '%', icon: <OpacityIcon fontSize="small" /> },
            { label: 'Sademäärä', value: weather.precipitation_sum, unit: 'mm', icon: <WaterDropIcon fontSize="small" /> },
            { label: 'Tuulen nopeus', value: weather.wind_speed_10m_mean, unit: 'm/s', icon: <AirIcon fontSize="small" /> },
            { label: 'Auringonsäteily', value: weather.shortwave_radiation_sum, unit: 'MJ/m²', icon: <WbSunnyIcon fontSize="small" /> },
            { label: 'ET₀', value: weather.et0_fao_evapotranspiration, unit: 'mm', icon: <GrassIcon fontSize="small" /> },
          ].map(({ label, value, unit, icon }) => (
            <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.25 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: 'text.secondary' }}>
                {icon}
                <Typography variant="body2" color="text.secondary">{label}</Typography>
              </Box>
              <Chip
                label={value != null ? `${Number(value).toFixed(1)} ${unit}` : '—'}
                size="small"
                sx={{ fontWeight: 600, minWidth: 72, justifyContent: 'center' }}
              />
            </Box>
          ))}
        </>
      )}
    </Box>
  );
}

// ─── Pääkomponentti ──────────────────────────────────────────────────────────

interface NdviViewPanelProps {
  /** fieldId tai geometriaHash — käytetty appStoressa */
  fieldId: string;
  fieldName?: string;
  /** GeoJSON-geometria Location-välilehteä varten */
  geometry?: { type: string; coordinates: unknown[] };
  /** Valittu MergedNdviEntry ylätasolta (NdviMapViewer navigoi tämän) */
  entry: MergedNdviEntry;
  /** Kaikki filteredImages NdviTimelineChart-komponenttia varten */
  entries: MergedNdviEntry[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

type TabKey = 'chart' | 'statistics' | 'onmap' | 'location';

export default function NdviViewPanel({
  fieldId,
  fieldName,
  geometry,
  entry,
  entries,
  selectedIndex,
  onSelect,
}: NdviViewPanelProps) {
  const [tab, setTab] = useState<TabKey>('chart');
  const { weatherData, imagesLoading, imagesError, activeGeometryHash } = useAppStore();

  const loading = imagesLoading && activeGeometryHash !== fieldId;
  const currentWeather = weatherData.find(w => w.sentinelid === entry.sentinelid);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (imagesError) {
    return <Alert severity="error" sx={{ m: 2 }}>{imagesError}</Alert>;
  }

  return (
    <Paper
      elevation={0}
      variant="outlined"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        borderRadius: 2,
      }}
    >
      {/* Tab-palkki */}
      <Tabs
        value={tab}
        onChange={(_, v: TabKey) => setTab(v)}
        variant="fullWidth"
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          minHeight: 40,
          '& .MuiTab-root': { minHeight: 40, fontSize: '0.8rem', py: 0 },
        }}
      >
        <Tab label="Chart" value="chart" />
        <Tab label="Statistics" value="statistics" />
        <Tab label="On Map" value="onmap" />
        <Tab label="Location" value="location" />
      </Tabs>

      {/* Sisältö */}
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {tab === 'chart' && (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <NdviTimelineChart
              entries={entries}
              selectedIndex={selectedIndex}
              onSelect={onSelect}
            />
          </Box>
        )}

        {tab === 'statistics' && (
          <StatsTab entry={entry} weather={currentWeather} />
        )}

        {tab === 'onmap' && (
          <OnMapTab entry={entry} />
        )}

        {tab === 'location' && geometry ? (
          <LocationTab geometry={geometry} fieldName={fieldName} />
        ) : tab === 'location' ? (
          <Alert severity="info" sx={{ m: 2 }}>
            Geometriatieto ei saatavilla — välitä <code>geometry</code>-prop komponentille.
          </Alert>
        ) : null}
      </Box>

      {/* Alapalkki — päivämäärä + kuvamäärä */}
      <Box
        sx={{
          borderTop: 1,
          borderColor: 'divider',
          px: 2,
          py: 0.75,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {fmt(entry.generationtime)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {selectedIndex + 1} / {entries.length}
        </Typography>
      </Box>
    </Paper>
  );
}
