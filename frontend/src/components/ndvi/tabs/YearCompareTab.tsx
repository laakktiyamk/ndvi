import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, useTheme, IconButton, Dialog,
  DialogTitle, DialogContent, Stack, Chip, Button
} from '@mui/material';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import StackedLineChartIcon from '@mui/icons-material/StackedLineChart';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

import type { MergedNdviEntry } from '../../../types';

interface Props {
  entries: MergedNdviEntry[];
}

const dayOfSeason = (iso: string): number => {
  const d = new Date(iso);
  const seasonStart = new Date(d.getFullYear(), 4, 1);
  return Math.floor((d.getTime() - seasonStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
};

const dayToLabel = (day: number, lang = 'fi'): string => {
  const d = new Date(2000, 4, 1);
  d.setDate(d.getDate() + day - 1);
  return lang === 'fi'
    ? `${d.getDate()}.${d.getMonth() + 1}.`
    : `${d.getMonth() + 1}/${d.getDate()}`;
};

const YEAR_COLORS = [
  '#4CAF50', '#2196F3', '#FF9800', '#E91E63',
  '#9C27B0', '#00BCD4', '#FF5722', '#8BC34A',
  '#3F51B5', '#FFC107',
];

type ChartType = 'line' | 'area';

export default function YearCompareTab({ entries }: Props) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [chartType, setChartType] = useState<ChartType>('line');

  const byYear = useMemo(() => {
    const map = new Map<number, MergedNdviEntry[]>();
    for (const e of entries) {
      const year = new Date(e.generationtime).getFullYear();
      if (!map.has(year)) map.set(year, []);
      map.get(year)!.push(e);
    }
    return map;
  }, [entries]);

  const years = useMemo(() => [...byYear.keys()].sort(), [byYear]);

  const [selectedYears, setSelectedYears] = useState<Set<number>>(new Set());

  const effectiveSelected = useMemo(() => {
    if (selectedYears.size === 0 || ![...selectedYears].some(y => years.includes(y))) {
      return new Set(years.slice(-4));
    }
    return selectedYears;
  }, [years, selectedYears]);

  const toggleYear = (year: number) => {
    setSelectedYears(prev => {
      const current = prev.size === 0 ? new Set(years.slice(-4)) : prev;
      if (current.size === 1 && current.has(year)) return current;
      const next = new Set(current);
      next.has(year) ? next.delete(year) : next.add(year);
      return next;
    });
  };

  const toggleChartType = () => {
    setChartType(prev => (prev === 'line' ? 'area' : 'line'));
  };

  if (years.length === 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Typography color="text.secondary" variant="body2">{t('noNdviData')}</Typography>
      </Box>
    );
  }

  const singleYear = years.length === 1;
  const activeYears = years.filter(y => effectiveSelected.has(y));

  const allDays = new Map<number, Record<string, number>>();
  for (const year of activeYears) {
    const yearEntries = byYear.get(year)!
      .sort((a, b) => new Date(a.generationtime).getTime() - new Date(b.generationtime).getTime());
    for (const e of yearEntries) {
      const day = dayOfSeason(e.generationtime);
      if (!allDays.has(day)) allDays.set(day, { day });
      allDays.get(day)![String(year)] = Math.round(e.stats.average * 1000) / 1000;
    }
  }

  const chartData = [...allDays.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, v]) => v);

  const lang = i18n.language;

  const tooltipStyle = {
    contentStyle: {
      fontSize: '0.75rem',
      padding: '4px 8px',
      lineHeight: 1.4,
      backgroundColor: theme.palette.background.paper,
      border: `1px solid ${theme.palette.divider}`,
      color: theme.palette.text.primary,
    },
    labelStyle: { fontWeight: 600, marginBottom: 2, color: theme.palette.text.primary },
    itemStyle: { color: theme.palette.text.primary },
  };

  // Yhteinen chippirivistö — renderöidään sekä pääviewssä että dialogissa
  const yearChips = (
    <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', mb: 1 }}>
      {years.map((year) => {
        const color = YEAR_COLORS[years.indexOf(year) % YEAR_COLORS.length];
        const on = effectiveSelected.has(year);
        return (
          <Chip
            key={year}
            label={year}
            size="small"
            onClick={() => toggleYear(year)}
            sx={{
              borderRadius: '12px',
              border: `1.5px solid ${color}`,
              backgroundColor: on ? color : 'transparent',
              color: on ? '#fff' : color,
              fontWeight: 500,
              fontSize: '0.7rem',
              height: 24,
              '& .MuiChip-label': { px: 1 },
              '&:hover': { opacity: 0.85 },
            }}
          />
        );
      })}
    </Stack>
  );

  // Toggle-nappi, joka näyttää vaihtoehtoisen (ei-aktiivisen) tilan tekstinä
  const chartTypeToggle = (
    <Button
      size="small"
      onClick={toggleChartType}
      startIcon={chartType === 'line' ? <StackedLineChartIcon fontSize="small" /> : <ShowChartIcon fontSize="small" />}
      sx={{
        textTransform: 'none',
        fontSize: '0.7rem',
        color: theme.palette.text.secondary,
        minWidth: 0,
        px: 1,
      }}
    >
      {chartType === 'line' ? t('showAsAreaChart') : t('showAsLineChart')}
    </Button>
  );

  const chart = (fullscreen = false) => (
    <ResponsiveContainer width="100%" height="100%">
      {chartType === 'line' ? (
        <LineChart data={chartData} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            dataKey="day"
            type="number"
            domain={['dataMin', 'dataMax']}
            tick={{ fontSize: fullscreen ? 11 : 10, fill: theme.palette.text.secondary }}
            tickFormatter={(day) => dayToLabel(Number(day), lang)}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 1]}
            tick={{ fontSize: fullscreen ? 11 : 10, fill: theme.palette.text.secondary }}
            width={40}
            tickFormatter={v => v.toFixed(1)}
          />
          <Tooltip
            {...tooltipStyle}
            labelFormatter={(day) => dayToLabel(Number(day), lang)}
            formatter={(value, name) => [Number(value).toFixed(3), String(name)]}
          />
          <Legend wrapperStyle={{ fontSize: '0.75rem', color: theme.palette.text.secondary }} />
          {activeYears.map((year) => (
            <Line
              key={year}
              type="monotone"
              dataKey={String(year)}
              stroke={YEAR_COLORS[years.indexOf(year) % YEAR_COLORS.length]}
              strokeWidth={fullscreen ? 2.5 : 2}
              dot={false}
              isAnimationActive={false}
              connectNulls
            />
          ))}
        </LineChart>
      ) : (
        <AreaChart data={chartData} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            dataKey="day"
            type="number"
            domain={['dataMin', 'dataMax']}
            tick={{ fontSize: fullscreen ? 11 : 10, fill: theme.palette.text.secondary }}
            tickFormatter={(day) => dayToLabel(Number(day), lang)}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 1]}
            tick={{ fontSize: fullscreen ? 11 : 10, fill: theme.palette.text.secondary }}
            width={40}
            tickFormatter={v => v.toFixed(1)}
          />
          <Tooltip
            {...tooltipStyle}
            labelFormatter={(day) => dayToLabel(Number(day), lang)}
            formatter={(value, name) => [Number(value).toFixed(3), String(name)]}
          />
          <Legend wrapperStyle={{ fontSize: '0.75rem', color: theme.palette.text.secondary }} />
          {activeYears.map((year) => (
            <Area
              key={year}
              type="monotone"
              dataKey={String(year)}
              stroke={YEAR_COLORS[years.indexOf(year) % YEAR_COLORS.length]}
              fill={YEAR_COLORS[years.indexOf(year) % YEAR_COLORS.length]}
              fillOpacity={0.15}
              strokeWidth={fullscreen ? 2.5 : 2}
              dot={false}
              isAnimationActive={false}
              connectNulls
            />
          ))}
        </AreaChart>
      )}
    </ResponsiveContainer>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
        {singleYear ? (
          <Typography variant="caption" color="text.secondary">
            {t('yearCompareHint') ?? 'Vertailu näkyy kun dataa on useammalta kasvukaudelta'}
          </Typography>
        ) : (
          <Typography variant="caption" color="text.secondary">
            NDVI — {t('yearCompare') ?? 'Vuosivertailu'}
          </Typography>
        )}
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
          {chartTypeToggle}
          <IconButton size="small" onClick={() => setExpanded(true)}>
            <OpenInFullIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Box>

      {yearChips}

      <Box sx={{ flex: 1, minHeight: 0 }}>
        {chart(false)}
      </Box>

      <Dialog
        open={expanded}
        onClose={() => setExpanded(false)}
        maxWidth="xl"
        fullWidth
        sx={{ '& .MuiDialog-paper': { height: 'calc(100vh - 64px)', maxHeight: 'calc(100vh - 64px)' } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 0 }}>
          <Typography variant="subtitle1">NDVI — {t('yearCompare') ?? 'Vuosivertailu'}</Typography>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            {chartTypeToggle}
            <IconButton size="small" onClick={() => setExpanded(false)}>
              <CloseFullscreenIcon fontSize="small" />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', pt: 1 }}>
          {yearChips}
          <Box sx={{ flex: 1, minHeight: 0 }}>
            {chart(true)}
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}