import { useTranslation } from 'react-i18next';
import {
  Box, TextField, Typography, CircularProgress,
  Alert, Divider, Stack,
} from '@mui/material';
import type { FieldInfo } from '../types';

interface Step2Props {
  fieldInfo: FieldInfo | null;
  fieldInfoLoading: boolean;
  customName: string;
  setCustomName: (v: string) => void;
  startDate: string;
  setStartDate: (v: string) => void;
  endDate: string;
  noDataFound: boolean;
  submitError: string;
}

export default function Step2Settings({
  fieldInfo, fieldInfoLoading,
  customName, setCustomName,
  startDate, setStartDate,
  endDate,
  noDataFound, submitError,
}: Step2Props) {
  const { t } = useTranslation();

  const today = new Date().toISOString().split('T')[0];

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {fieldInfoLoading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress size={16} />
          <Typography variant="caption" color="text.secondary">{t('fetchingLocation')}</Typography>
        </Box>
      )}

      {fieldInfo && (
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            {t('identifiedLocation')}
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>{fieldInfo.address}</Typography>
          <Typography variant="caption" color="text.secondary">
            {fieldInfo.centroid.lat.toFixed(5)}°N, {fieldInfo.centroid.lon.toFixed(5)}°E
          </Typography>
        </Box>
      )}

      <Divider />

      <TextField
        label={t('fieldName')}
        value={customName}
        onChange={(e) => setCustomName(e.target.value)}
        size="small"
        fullWidth
        helperText={t('fieldNameHelper')}
      />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          label={t('startDate')}
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          fullWidth
          size="small"
        />
        <TextField
          label={t('endDate')}
          type="date"
          value={endDate}
          disabled
          slotProps={{ inputLabel: { shrink: true } }}
          fullWidth
          size="small"
          helperText={endDate === today ? t('today') : t('seasonEnd')}
        />
      </Stack>

      {noDataFound && <Alert severity="info">{t('noNdviData')}</Alert>}
      {submitError && <Alert severity="error">{submitError}</Alert>}
    </Box>
  );
}