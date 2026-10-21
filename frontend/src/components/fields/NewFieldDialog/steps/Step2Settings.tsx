import { useTranslation } from 'react-i18next';
import {
  Box, TextField, Typography, CircularProgress,
  Alert, Divider, Stack, List, ListItem, ListItemText,
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
  fieldNames?: string[] | null;
}

export default function Step2Settings({
  fieldInfo, fieldInfoLoading,
  customName, setCustomName,
  startDate, setStartDate,
  endDate,
  noDataFound, submitError,
  fieldNames,
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

      {fieldNames && fieldNames.length > 0 ? (
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {t('fieldsCount', { count: fieldNames.length, defaultValue: '{{count}} fields' })}
          </Typography>
          <Box
            sx={{
              mt: 1,
              maxHeight: 220,
              overflowY: 'auto',
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
            }}
          >
            <List dense disablePadding>
              {fieldNames.map((n, i) => (
                <ListItem key={i} divider={i < fieldNames.length - 1}>
                  <ListItemText
                    primary={n || t('unnamedField', { defaultValue: '(unnamed)' })}
                    slotProps={{
                      primary: {
                        variant: 'body2',
                        color: n ? 'text.primary' : 'text.secondary',
                      },
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </Box>
      ) : (
        <TextField
          label={t('fieldName')}
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          size="small"
          fullWidth
          helperText={t('fieldNameHelper')}
        />
      )}

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