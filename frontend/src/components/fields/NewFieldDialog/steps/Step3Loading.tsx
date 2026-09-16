import { useTranslation } from 'react-i18next';
import { Box, Button, CircularProgress, Typography, Alert } from '@mui/material';

interface Step3Props {
  fetchError: string;
  onBack: () => void;
}

export default function Step3Loading({ fetchError, onBack }: Step3Props) {
  const { t } = useTranslation();

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