import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Grid,
} from '@mui/material';
import GrassIcon from '@mui/icons-material/Grass';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { ICropParcel } from '../../types';

interface CropStatisticsPanelProps {
  fields: {
    kasvulohkot?: ICropParcel[];
  }[];
}

interface CropSummary {
  kasvikoodi: string;
  pinta_ala: number;       // ha
  luomu: boolean;
}

// Fallback-väri jos crop-type coloreja ei ole saatavilla
const hashColor = (kasvikoodi: string): string => {
  let hash = 0;
  for (const char of kasvikoodi) {
    hash = char.charCodeAt(0) + ((hash << 5) - hash);
  }
  return `hsl(${Math.abs(hash) % 360}, 55%, 50%)`;
};

export default function CropStatisticsPanel({ fields }: CropStatisticsPanelProps) {
  const { t } = useTranslation();

  // Kerätään kaikki kasvulohkot kaikilta pelloilta ja ryhmitellään kasvilajin mukaan
  const summaryMap = new Map<string, CropSummary>();

  for (const field of fields) {
    for (const kl of field.kasvulohkot ?? []) {
      const existing = summaryMap.get(kl.kasvikoodi);
      const ha = kl.pinta_ala; // backend palauttaa jo hehtaareina
      if (existing) {
        existing.pinta_ala += ha;
      } else {
        summaryMap.set(kl.kasvikoodi, {
          kasvikoodi: kl.kasvikoodi,
          pinta_ala: ha,
          luomu: kl.luomuviljely === '1',
        });
      }
    }
  }

  const data = [...summaryMap.values()]
    .sort((a, b) => b.pinta_ala - a.pinta_ala)
    .map((d) => ({ ...d, label: t(`crop:${d.kasvikoodi}`) }));

  const totalHa = data.reduce((s, d) => s + d.pinta_ala, 0);

  if (data.length === 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
        <GrassIcon fontSize="small" color="disabled" />
        <Typography variant="body2" color="text.secondary">
          {t('noCropData') ?? 'Ei kasvilajitietoja'}
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={2} sx={{ alignItems: 'flex-start' }}>

      {/* Piirakkagraafi */}
      <Grid size={{ xs: 12, sm: 5 }}>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              dataKey="pinta_ala"
              nameKey="label"
              cx="50%"
              cy="50%"
              outerRadius={80}
              isAnimationActive={false}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.kasvikoodi}
                  fill={hashColor(entry.kasvikoodi)}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [
                `${Number(value).toFixed(2)} ha (${((Number(value) / totalHa) * 100).toFixed(1)} %)`,
                name as string,
              ]}
            />
            <Legend
              formatter={(value) => (
                <span style={{ fontSize: 11 }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </Grid>

      {/* Hehtaarilista */}
      <Grid size={{ xs: 12, sm: 7 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, pt: 0.5 }}>
          {data.map((entry) => (
            <Box
              key={entry.kasvikoodi}
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  flexShrink: 0,
                  bgcolor: hashColor(entry.kasvikoodi),
                }}
              />
              <Typography variant="body2" sx={{ flex: 1, minWidth: 0 }} noWrap>
                {entry.label}
                {entry.luomu && ' 🌿'}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, flexShrink: 0 }}>
                {entry.pinta_ala.toFixed(2)} ha
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, minWidth: 40, textAlign: 'right' }}>
                {((entry.pinta_ala / totalHa) * 100).toFixed(1)} %
              </Typography>
            </Box>
          ))}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, pt: 0.5, borderTop: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ width: 10, flexShrink: 0 }} />
            <Typography variant="body2" sx={{ flex: 1 }} color="text.secondary">
              {t('total') ?? 'Yhteensä'}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, flexShrink: 0 }}>
              {totalHa.toFixed(2)} ha
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, minWidth: 40, textAlign: 'right' }}>
              100 %
            </Typography>
          </Box>
        </Box>
      </Grid>

    </Grid>
  );
}