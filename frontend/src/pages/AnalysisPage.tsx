import { useTranslation } from 'react-i18next';
import { Box, Typography } from '@mui/material';

export default function AnalysisPage() {
  const { t } = useTranslation();
  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>{t('analysis')}</Typography>
      <Typography color="text.secondary">{t('analysisPlaceholder')}</Typography>
    </Box>
  );
}
