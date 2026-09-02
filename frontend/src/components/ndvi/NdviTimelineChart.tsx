import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material';
import {
  ComposedChart, Line, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceDot, ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';
import {
  Typography, Box, ToggleButtonGroup, ToggleButton,
  Dialog, DialogContent, DialogTitle, IconButton,
  FormGroup, FormControlLabel, Checkbox,
} from '@mui/material';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import BarChartIcon from '@mui/icons-material/BarChart';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';

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

const fmtDate = (iso: string, lang = 'fi') => {
  const d = new Date(iso);
  return d.toLocaleDateString(lang === 'fi' ? 'fi-FI' : 'en-US');
};

const fmtDateShort = (iso: string, lang = 'fi') => {
  const d = new Date(iso);
  return d.toLocaleDateString(lang === 'fi' ? 'fi-FI' : 'en-US', {
    day: 'numeric', month: 'numeric',
  });
};

type ChartType = 'line' | 'bar';

interface Extras {
  min: boolean;
  max: boolean;
  std: boolean;
}

export default function NdviTimelineChart({
  entries, selectedIndex, onSelect, chartHeight = 160,
}: Props) {
  const { t, i18n } = useTranslation();
  const [chartType, setChartType] = useState<ChartType>('line');
  const [expanded, setExpanded] = useState(false);
  const [extras, setExtras] = useState<Extras>({ min: false, max: false, std: false });

  if (!entries.length) return null;

  const theme = useTheme();  

  const data = entries.map((e, i) => ({
    i,
    date: e.generationtime,
    mean: parseFloat(e.stats.average.toFixed(4)),
    min:  parseFloat(e.stats.min.toFixed(4)),
    max:  parseFloat(e.stats.max.toFixed(4)),
    // Area-komponentti käyttää [low, high] -muotoa shaded alueelle
    stdRange: [
      parseFloat(Math.max(0, e.stats.average - e.stats.std).toFixed(4)),
      parseFloat(Math.min(1, e.stats.average + e.stats.std).toFixed(4)),
    ] as [number, number],
    color: NDVI_COLOR(e.stats.average),
  }));

  const selected = data[selectedIndex];

  const handleClick = (e: any) => {
    if (!e) return;
    const i = parseInt(e.activeIndex, 10);
    if (!isNaN(i)) onSelect(i);
  };

  const toggleExtra = (key: keyof Extras) =>
    setExtras(prev => ({ ...prev, [key]: !prev[key] }));

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
        tickFormatter={(iso) => fmtDateShort(iso, i18n.language)}
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
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    color: theme.palette.text.primary,
  }}
  labelStyle={{ fontWeight: 600, marginBottom: 2, color: theme.palette.text.primary }}
  itemStyle={{ color: theme.palette.text.primary }}
        formatter={(value, name) => {
          // stdRange tulee arrayna — näytetään low–high
          if (name === 'stdRange' && Array.isArray(value)) {
            return [`${Number(value[0]).toFixed(3)} – ${Number(value[1]).toFixed(3)}`, '±std'];
          }
          return [Number(value).toFixed(3), name];
        }}
        labelFormatter={(label) => fmtDate(String(label ?? ''), i18n.language)}
      />
    </>
  );

  // Extra-kontrollit — vain line-moodissa
  const extraControls = chartType === 'line' && (
    <FormGroup row sx={{ mt: 0.5, gap: 0 }}>
      {(['std', 'min', 'max'] as const).map((key) => (
        <FormControlLabel
          key={key}
          control={
            <Checkbox
              checked={extras[key]}
              onChange={() => toggleExtra(key)}
              size="small"
              sx={{ py: 0.25, color: '#689F38', '&.Mui-checked': { color: '#689F38' } }}
            />
          }
          label={
            <Typography variant="caption" color="text.secondary">
              {key === 'std' ? '±std' : key}
            </Typography>
          }
        />
      ))}
    </FormGroup>
  );

  const chartContent = (
    <>
      {chartType === 'line' ? (
        <ComposedChart {...commonProps}>
          {axes}

          {/* std varjo — Area käyttää [low, high] arrayta */}
          {extras.std && (
            <Area
              dataKey="stdRange"
              stroke="none"
              fill="#689F38"
              fillOpacity={0.15}
              isAnimationActive={false}
              legendType="none"
              tooltipType="none"
              activeDot={false}
            />
          )}

          {/* min katkoviiva */}
          {extras.min && (
            <Line
              type="monotone"
              dataKey="min"
              stroke="#689F38"
              strokeWidth={1}
              strokeDasharray="3 3"
              strokeOpacity={0.6}
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
          )}

          {/* max katkoviiva */}
          {extras.max && (
            <Line
              type="monotone"
              dataKey="max"
              stroke="#689F38"
              strokeWidth={1}
              strokeDasharray="3 3"
              strokeOpacity={0.6}
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
          )}

          {/* avg — pääviiva */}
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
              <ReferenceLine x={selected.date} stroke={selected.color} strokeDasharray="4 2" strokeWidth={1.5} />
              <ReferenceDot x={selected.date} y={selected.mean} r={7} fill={selected.color} stroke="#fff" strokeWidth={2} />
            </>
          )}
        </ComposedChart>
      ) : (
        // Bar-moodi täsmälleen alkuperäinen
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
            <ReferenceLine x={selected.date} stroke={selected.color} strokeDasharray="4 2" strokeWidth={1.5} />
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
        <ToggleButton value="line" aria-label={t('lineChart')}><ShowChartIcon fontSize="small" /></ToggleButton>
        <ToggleButton value="bar" aria-label={t('barChart')}><BarChartIcon fontSize="small" /></ToggleButton>
      </ToggleButtonGroup>
      <IconButton size="small" onClick={() => setExpanded(!expanded)}>
        {expanded ? <CloseFullscreenIcon fontSize="small" /> : <OpenInFullIcon fontSize="small" />}
      </IconButton>
    </Box>
  );

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          NDVI avg — {t('chart')}
        </Typography>
        {controls}
      </Box>

      {extraControls}

      <ResponsiveContainer width="100%" height={chartHeight}>
        {chartContent}
      </ResponsiveContainer>

      <Dialog
        open={expanded}
        onClose={() => setExpanded(false)}
        maxWidth="xl"
        fullWidth
        sx={{ '& .MuiDialog-paper': { height: 'calc(100vh - 64px)', maxHeight: 'calc(100vh - 64px)' } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 0 }}>
          <Box>
            <Typography variant="subtitle1">NDVI avg — {t('chart')}</Typography>
            {extraControls}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>{controls}</Box>
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