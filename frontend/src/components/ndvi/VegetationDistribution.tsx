import { Box, Typography, Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface ScaleClass {
  amount: number;
  color: string;
}

interface Props {
  scale?: ScaleClass[];
}

export default function VegetationDistribution({ scale }: Props) {
  const { t } = useTranslation();

  if (!scale || scale.length === 0) return null;

  return (
    <Box sx={{ px: 2, py: 1, borderTop: 1, borderColor: 'divider', flexShrink: 0 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
        {t('vegetationDistribution')}
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