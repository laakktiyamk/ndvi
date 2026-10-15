import { useTranslation } from 'react-i18next';
import { Box, Button, CircularProgress, LinearProgress, Typography, Alert } from '@mui/material';

interface Step3Props {
  fetchError: string;
  onBack: () => void;
  progress?: { done: number; failed: number; total: number } | null;
}

export default function Step3Loading({ fetchError, onBack, progress }: Step3Props) {
  const { t } = useTranslation();

  const processed = progress ? progress.done + progress.failed : 0;
  const percent = progress && progress.total > 0
    ? Math.round((processed / progress.total) * 100)
    : 0;

  return (
    <Box sx={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
      py: 6,
      px: 3,
    }}>
      {!fetchError ? (
        <>
          <CircularProgress size={56} />
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {t('fetchingImages') || 'Fetching NDVI Images...'}
          </Typography>

          {progress && (
            <Box sx={{ width: '100%', maxWidth: 400 }}>
              <LinearProgress variant="determinate" value={percent} />
              <Typography variant="body2" sx={{ textAlign: 'center', mt: 1 }}>
                {processed}/{progress.total}
                {progress.failed > 0 && ` (${progress.failed} ${t('failed') || 'failed'})`}
              </Typography>
            </Box>
          )}

          <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
            {t('fetchingImagesHint') || 'This may take a moment. Please wait.'}
          </Typography>
        </>
      ) : (
        <>
          <Alert severity="error" sx={{ width: '100%', maxWidth: 400 }}>
            {fetchError}
          </Alert>
          <Button variant="contained" onClick={onBack}>
            OK
          </Button>
        </>
      )}
    </Box>
  );
}