import { useState } from 'react';
import { Box, Tabs, Tab, Paper, Typography, CircularProgress, Alert } from '@mui/material';
import { useAppStore } from '../../store/appStore';
import type { MergedNdviEntry } from '../../types';

import NdviTimelineChart from './NdviTimelineChart';
import StatisticsTab from './tabs/StatisticsTab';
import OnMapTab from './tabs/OnMapTab';
import LocationTab from './tabs/LocationTab';

// ─── Tyypit ──────────────────────────────────────────────────────────────────

interface Props {
  fieldId: string;
  fieldName?: string;
  geometry?: { type: string; coordinates: unknown[] };
  entry: MergedNdviEntry;
  entries: MergedNdviEntry[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

type TabKey = 'chart' | 'statistics' | 'onmap' | 'location';

const fmt = (date: string) =>
  new Date(date).toLocaleDateString('fi-FI', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });

// ─── Komponentti ─────────────────────────────────────────────────────────────

export default function NdviViewPanel({
  fieldId,
  fieldName,
  geometry,
  entry,
  entries,
  selectedIndex,
  onSelect,
}: Props) {
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
        // height: '100%' toimii vain jos vanhemmalla on eksplisiittinen korkeus.
        // NdviMapViewerissä oikean panelin wrapper tarvitsee:
        //   display: 'flex', flexDirection: 'column'
        // jotta tämä täyttää tilan oikein mobiilissakin (minHeight: 420).
        height: '100%',
        overflow: 'hidden',
        borderRadius: 2,
      }}
    >
      {/* Tab-palkki — suomenkieliset labelit yhtenäistävät UI:n kielen */}
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
        <Tab label="Kaavio"     value="chart"      />
        <Tab label="Tilastot"   value="statistics" />
        <Tab label="Kartalla"   value="onmap"      />
        <Tab label="Sijainti"   value="location"   />
      </Tabs>

      {/* Tab-sisältö */}
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        {tab === 'chart' && (
          <NdviTimelineChart
            entries={entries}
            selectedIndex={selectedIndex}
            onSelect={onSelect}
            chartHeight={220}
          />
        )}

        {tab === 'statistics' && (
          <StatisticsTab
            entry={entry}
            weather={currentWeather}
          />
        )}

        {tab === 'onmap' && (
          <OnMapTab entry={entry} />
        )}

        {tab === 'location' && (
          geometry
            ? <LocationTab geometry={geometry} fieldName={fieldName} />
            : <Alert severity="info" sx={{ m: 2 }}>
                Geometriatieto ei saatavilla — välitä <code>geometry</code>-prop komponentille.
              </Alert>
        )}
      </Box>

      {/* Alapalkki */}
      <Box sx={{
        borderTop: 1,
        borderColor: 'divider',
        px: 2,
        py: 0.75,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
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
