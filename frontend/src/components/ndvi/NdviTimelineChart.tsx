import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceDot, ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';
import {
  Typography, Box, ToggleButtonGroup, ToggleButton,
  Dialog, DialogContent, DialogTitle, IconButton,
} from '@mui/material';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import BarChartIcon from '@mui/icons-material/BarChart';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
//import CloseIcon from '@mui/icons-material/Close';

import type { MergedNdviEntry } from '../../types';


interface Props {
  entries: MergedNdviEntry[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  chartHeight?: number;
}

const NDVI_COLOR = (v: number) => {
  if (v >= 0.6) return '#2E7D32';
  if (v >= 0.4) return '#689F38';
  if (v >= 0.2) return '#F9A825';
  return '#C62828';
};

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getDate()}.${d.getMonth() + 1}.`;
};

type ChartType = 'line' | 'bar';

export default function NdviTimelineChart({ entries, selectedIndex, onSelect, chartHeight = 160 }: Props) {
  const { t } = useTranslation();
  const [chartType, setChartType] = useState<ChartType>('line');
  const [expanded, setExpanded] = useState(false);

  if (!entries.length) return null;

  const data = entries.map((e, i) => ({
    i,
    date: e.generationtime,
    mean: parseFloat(e.stats.average.toFixed(3)),
    color: NDVI_COLOR(e.stats.average),
  }));

  const selected = data[selectedIndex];


  const handleClick = (e: any) => {
    if (!e) return;
    const i = parseInt(e.activeIndex, 10);
    if (!isNaN(i)) {
      console.log('calling onSelect with:', i);
      onSelect(i);
    }
  };

  /*
  const handleClick = (e: any) => {
    const payload = e?.activePayload?.[0]?.payload ?? e?.activePayload?.[0];
    const item = payload?.payload ?? payload;
    if (item && typeof item.i === 'number') onSelect(item.i);
  };*/

  const commonProps = {
    data,
    margin: { top: 8, right: 16, left: -16, bottom: 0 },
    onClick: handleClick,
    style: { cursor: 'pointer' },
  };

  const axes = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.3} />
      <XAxis
        dataKey="date"
        tickFormatter={fmtDate}
        tick={{ fontSize: 10 }}
        interval="preserveStartEnd"
      />
      <YAxis
        domain={[0, 1]}
        tickFormatter={(v) => v.toFixed(1)}
        tick={{ fontSize: 10 }}
        width={36}
      />

      <Tooltip
        contentStyle={{
          fontSize: '0.75rem',
          padding: '4px 8px',
          lineHeight: 1.4,
        }}
        labelStyle={{
          color: '#000',
          fontWeight: 600,
          marginBottom: 2,
        }}
        formatter={(value) => {
          return [Number(value).toFixed(3), 'NDVI avg'];
        }}
        labelFormatter={(label) => fmtDate(String(label ?? ''))}
      />

    </>
  );

  const chartContent = (
    <>
      {chartType === 'line' ? (
        <LineChart {...commonProps}>
          {axes}
          <Line
            type="monotone"
            dataKey="mean"
            stroke="#689F38"
            strokeWidth={2}
            dot={(props) => {
              const { cx, cy, payload } = props;
              if (payload.i === selectedIndex)
                return <circle key={`dot-${payload.i}`} cx={cx} cy={cy} r={7} fill={payload.color} stroke="#fff" strokeWidth={2} />;
              return <g key={`dot-${payload.i}`} />;
            }}
            activeDot={false}
            isAnimationActive={false}
          />
          {selected && (
            <>
              <ReferenceLine
                x={selected.date}
                stroke={selected.color}
                strokeDasharray="4 2"
                strokeWidth={1.5}
              />
              <ReferenceDot
                x={selected.date}
                y={selected.mean}
                r={7}
                fill={selected.color}
                stroke="#fff"
                strokeWidth={2}
              />
            </>
          )}
        </LineChart>
      ) : (
        <BarChart {...commonProps}>
          {axes}
          <Bar dataKey="mean" isAnimationActive={false} radius={[2, 2, 0, 0]}>
            {data.map((entry) => (
              <Cell
                key={`cell-${entry.i}`}
                fill={entry.color}
                opacity={entry.i === selectedIndex ? 1 : 0.55}
                stroke={entry.i === selectedIndex ? '#fff' : 'none'}
                strokeWidth={entry.i === selectedIndex ? 1.5 : 0}
              />
            ))}
          </Bar>
          {selected && (
            <ReferenceLine
              x={selected.date}
              stroke={selected.color}
              strokeDasharray="4 2"
              strokeWidth={1.5}
            />
          )}
        </BarChart>
      )}
    </>
  );

  const controls = (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <ToggleButtonGroup
        value={chartType}
        exclusive
        onChange={(_, v) => v && setChartType(v)}
        size="small"
        sx={{ '& .MuiToggleButton-root': { py: 0.25, px: 0.75 } }}
      >
        <ToggleButton value="line" aria-label={t('lineChart')}>
          <ShowChartIcon fontSize="small" />
        </ToggleButton>
        <ToggleButton value="bar" aria-label={t('barChart')}>
          <BarChartIcon fontSize="small" />
        </ToggleButton>
      </ToggleButtonGroup>
      <IconButton size="small" onClick={() => setExpanded(!expanded)}>
        {expanded
          ? <CloseFullscreenIcon fontSize="small" />
          : <OpenInFullIcon fontSize="small" />
        }
      </IconButton>
    </Box>
  );

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="caption" color="text.secondary">
          NDVI avg — {t('chart')}
        </Typography>
        {controls}
      </Box>

      {/* Normaali chart */}
      <ResponsiveContainer width="100%" height={chartHeight}>
        {chartContent}
      </ResponsiveContainer>

      {/* Laajennettu dialogi */}
      <Dialog
        open={expanded}
        onClose={() => setExpanded(false)}
        maxWidth="xl"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            height: 'calc(100vh - 64px)',
            maxHeight: 'calc(100vh - 64px)',
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 0 }}>
          <Typography variant="subtitle1">NDVI avg — {t('chart')}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {controls}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', pt: 1 }}>
          <Box sx={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              {chartContent}
            </ResponsiveContainer>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}