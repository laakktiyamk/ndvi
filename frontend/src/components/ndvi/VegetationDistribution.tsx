import { Box, Typography, Tooltip, Chip } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface ScaleClass {
  amount: number;
  color: string;
}

interface Props {
  scale?: ScaleClass[];
  avgValue?: number;
}

function getQualityKey(avg: number): { key: string; fallback: string } {
  if (avg < 0.15) return { key: 'vegetationQuality.poor', fallback: 'Heikko' };
  if (avg < 0.3) return { key: 'vegetationQuality.fair', fallback: 'Tyydyttävä' };
  if (avg < 0.45) return { key: 'vegetationQuality.good', fallback: 'Hyvä' };
  return { key: 'vegetationQuality.excellent', fallback: 'Erinomainen' };
}

/*
function chipTokens(avg: number) {
  if (avg >= 0.45) return { bg: '#EAF3DE', fg: '#33691E', border: '#8BC34A' };
  if (avg >= 0.3)  return { bg: '#F1F8E9', fg: '#558B2F', border: '#AED581' };
  if (avg >= 0.15) return { bg: '#FFF8E1', fg: '#F57F17', border: '#FFD54F' };
  return                  { bg: '#FFEBEE', fg: '#B71C1C', border: '#EF9A9A' };
}*/

function chipTokens(avg: number) {
  if (avg >= 0.6) return { bg: '#2E7D32', fg: '#fff' };
  if (avg >= 0.4) return { bg: '#689F38', fg: '#fff' };
  if (avg >= 0.2) return { bg: '#F9A825', fg: '#fff' };
  return { bg: '#C62828', fg: '#fff' };
}

export default function VegetationDistribution({ scale, avgValue }: Props) {
  const { t } = useTranslation();

  if (!scale || scale.length === 0) return null;

  const quality = typeof avgValue === 'number' ? getQualityKey(avgValue) : null;
  const tokens = typeof avgValue === 'number' ? chipTokens(avgValue) : null;

  return (
    <Box sx={{ px: 2, py: 1, borderTop: 1, borderColor: 'divider', flexShrink: 0 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}
      >
        <span>{t('vegetationDistribution')}</span>

        {quality && tokens && (
          <Chip
            label={`${avgValue!.toFixed(2)} · ${t(quality.key, quality.fallback)}`}
            size="small"
            sx={{
              bgcolor: tokens.bg,
              color: tokens.fg,
              fontWeight: 600,
              fontSize: '0.72rem',
              height: 22,
              '& .MuiChip-label': { px: 1 },
            }}
          />
        )}
      </Typography>

      <Box sx={{ display: 'flex', height: 14, borderRadius: 1, overflow: 'hidden', width: '100%' }}>
        {scale.map((cls, i) =>
          cls.amount < 0.5 ? null : (
            <Tooltip key={i} title={`${cls.amount.toFixed(1)}%`} arrow>
              <Box sx={{ width: `${cls.amount}%`, bgcolor: cls.color, transition: 'width 0.4s ease' }} />
            </Tooltip>
          )
        )}
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.75 }}>
        {scale.map((cls, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: cls.color, flexShrink: 0 }} />
            <Typography variant="caption" color="text.secondary">{cls.amount.toFixed(1)}%</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}