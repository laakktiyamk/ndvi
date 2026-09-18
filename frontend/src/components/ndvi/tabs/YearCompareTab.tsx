import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, useTheme, IconButton, Dialog,
  DialogTitle, DialogContent, Stack, Chip, ToggleButton, ToggleButtonGroup
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
import type { IGrowingSeason } from '../../../services/growingSeasonService';
import { useAppStore } from '../../../store/appStore';

interface Props {
  entries: MergedNdviEntry[];
}

type ChartType = 'line' | 'area';
type Resolution = 'day' | 'week' | 'month';

// Kasvukauden alusta kulunut kokonainen päivä (startDay.startMonth = 1)
const dayOfSeason = (iso: string, gs: IGrowingSeason): number => {
  const d = new Date(iso);
  const seasonStart = new Date(d.getFullYear(), gs.startMonth - 1, gs.startDay);
  return Math.floor((d.getTime() - seasonStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
};

const weekOfSeason = (iso: string, gs: IGrowingSeason): number =>
  Math.max(1, Math.floor((dayOfSeason(iso, gs) - 1) / 7) + 1);

// Palauttaa 0-pohjaisen kuukausi-offsetin kasvukauden alusta
const monthOffsetOfSeason = (iso: string, gs: IGrowingSeason): number => {
  const d = new Date(iso);
  const startMonth = gs.startMonth - 1; // JS 0-pohjainen
  const yearDiff = d.getFullYear() - new Date(iso.slice(0, 4) + '-01-01').getFullYear();
  return (d.getMonth() - startMonth + 12 * yearDiff + 12) % 12;
};

const bucketOf = (iso: string, gs: IGrowingSeason, res: Resolution): number => {
  if (res === 'week') return weekOfSeason(iso, gs);
  if (res === 'month') return monthOffsetOfSeason(iso, gs);
  return dayOfSeason(iso, gs);
};

// Muuntaa bucket-numeron label-tekstiksi
const bucketToLabel = (
  bucket: number,
  gs: IGrowingSeason,
  res: Resolution,
  lang = 'fi'
): string => {
  if (res === 'day') {
    // bucket = päivä kasvukauden alusta
    const d = new Date(2000, gs.startMonth - 1, gs.startDay);
    d.setDate(d.getDate() + bucket - 1);
    return lang === 'fi'
      ? `${d.getDate()}.${d.getMonth() + 1}.`
      : `${d.getMonth() + 1}/${d.getDate()}`;
  }
  if (res === 'week') {
    // bucket = viikkonumero, näytetään viikon alkupäivä
    const d = new Date(2000, gs.startMonth - 1, gs.startDay);
    d.setDate(d.getDate() + (bucket - 1) * 7);
    return lang === 'fi'
      ? `${d.getDate()}.${d.getMonth() + 1}.`
      : `${d.getMonth() + 1}/${d.getDate()}`;
  }
  // month: bucket = 0-pohjainen offset kasvukauden alusta
  const d = new Date(2000, gs.startMonth - 1 + bucket, 1);
  return lang === 'fi'
    ? `${d.toLocaleString('fi-FI', { month: 'short' })}`
    : `${d.toLocaleString('en-US', { month: 'short' })}`;
};

const YEAR_COLORS = [
  '#4CAF50', '#2196F3', '#FF9800', '#E91E63',
  '#9C27B0', '#00BCD4', '#FF5722', '#8BC34A',
  '#3F51B5', '#FFC107',
];

// Fallback jos growingSeason ei ole vielä ladattu
const DEFAULT_GS: IGrowingSeason = { startMonth: 5, startDay: 1, endMonth: 10, endDay: 31 };

export default function YearCompareTab({ entries }: Props) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [chartType, setChartType] = useState<ChartType>('area');
  const [resolution, setResolution] = useState<Resolution>('week');

  const growingSeason = useAppStore(s => s.growingSeason) ?? DEFAULT_GS;

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

  const toggleChartType = () => setChartType(prev => prev === 'line' ? 'area' : 'line');

  if (years.length === 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Typography color="text.secondary" variant="body2">{t('noNdviData')}</Typography>
      </Box>
    );
  }

  const singleYear = years.length === 1;
  const activeYears = years.filter(y => effectiveSelected.has(y));

  // Aggregointi bucketteihin
  const allBuckets = new Map<number, Record<string, { sum: number; count: number }>>();
  for (const year of activeYears) {
    for (const e of byYear.get(year)!) {
      const bucket = bucketOf(e.generationtime, growingSeason, resolution);
      if (bucket < 1) continue; // hylätään ennen kasvukauden alkua olevat
      if (!allBuckets.has(bucket)) allBuckets.set(bucket, {});
      const row = allBuckets.get(bucket)!;
      const key = String(year);
      if (!row[key]) row[key] = { sum: 0, count: 0 };
      row[key].sum += e.stats.average;
      row[key].count += 1;
    }
  }

  const chartData = [...allBuckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([bucket, yearData]) => {
      const row: Record<string, number> = { bucket };
      for (const [key, { sum, count }] of Object.entries(yearData)) {
        row[key] = Math.round((sum / count) * 1000) / 1000;
      }
      return row;
    });

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

  const resolutionToggle = (
    <ToggleButtonGroup
      value={resolution}
      exclusive
      onChange={(_, val) => val && setResolution(val)}
      size="small"
      sx={{
        height: 24,
        '& .MuiToggleButton-root': {
          px: 1, py: 0,
          fontSize: '0.65rem',
          textTransform: 'none',
          color: theme.palette.text.secondary,
          border: `1px solid ${theme.palette.divider}`,
          '&.Mui-selected': {
            color: theme.palette.primary.main,
            backgroundColor: theme.palette.action.selected,
          },
        },
      }}
    >
      <ToggleButton value="day">{lang === 'fi' ? 'Pv' : 'Day'}</ToggleButton>
      <ToggleButton value="week">{lang === 'fi' ? 'Vko' : 'Wk'}</ToggleButton>
      <ToggleButton value="month">{lang === 'fi' ? 'Kk' : 'Mo'}</ToggleButton>
    </ToggleButtonGroup>
  );

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

  const chartTypeToggle = (
    <IconButton size="small" onClick={toggleChartType}>
      {chartType === 'line'
        ? <StackedLineChartIcon fontSize="small" />
        : <ShowChartIcon fontSize="small" />}
    </IconButton>
  );

  const xAxisProps = {
    dataKey: 'bucket',
    type: 'number' as const,
    domain: ['dataMin', 'dataMax'] as [string, string],
    tickFormatter: (v: number) => bucketToLabel(v, growingSeason, resolution, lang),
    interval: 'preserveStartEnd' as const,
  };

  const chart = (fullscreen = false) => {
    const sw = fullscreen ? 2.5 : 2;
    const tickStyle = { fontSize: fullscreen ? 11 : 10, fill: theme.palette.text.secondary };
    const showDot = resolution === 'month';

    const commonChildren = (
      <>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis {...xAxisProps} tick={tickStyle} />
        <YAxis
          domain={[0, 1]}
          tick={tickStyle}
          width={40}
          tickFormatter={v => v.toFixed(1)}
        />
        <Tooltip
          {...tooltipStyle}
          labelFormatter={(v) => bucketToLabel(Number(v), growingSeason, resolution, lang)}
          formatter={(value, name) => [Number(value).toFixed(3), String(name)]}
        />
        <Legend wrapperStyle={{ fontSize: '0.75rem', color: theme.palette.text.secondary }} />
      </>
    );

    return (
      <ResponsiveContainer width="100%" height="100%">
        {chartType === 'line' ? (
          <LineChart data={chartData} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
            {commonChildren}
            {activeYears.map((year) => (
              <Line
                key={year}
                type="monotone"
                dataKey={String(year)}
                stroke={YEAR_COLORS[years.indexOf(year) % YEAR_COLORS.length]}
                strokeWidth={sw}
                dot={showDot}
                isAnimationActive={false}
                connectNulls
              />
            ))}
          </LineChart>
        ) : (
          <AreaChart data={chartData} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
            {commonChildren}
            {activeYears.map((year) => (
              <Area
                key={year}
                type="monotone"
                dataKey={String(year)}
                stroke={YEAR_COLORS[years.indexOf(year) % YEAR_COLORS.length]}
                fill={YEAR_COLORS[years.indexOf(year) % YEAR_COLORS.length]}
                fillOpacity={0.15}
                strokeWidth={sw}
                dot={showDot}
                isAnimationActive={false}
                connectNulls
              />
            ))}
          </AreaChart>
        )}
      </ResponsiveContainer>
    );
  };

  const headerControls = (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
      {resolutionToggle}
      {chartTypeToggle}
    </Stack>
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
        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
          {headerControls}
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
          <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
            {headerControls}
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