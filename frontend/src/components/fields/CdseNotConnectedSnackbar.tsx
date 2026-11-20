import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Alert, Button, Portal, Snackbar } from '@mui/material';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CdseNotConnectedSnackbar({ open, onClose }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Portal>
      <Snackbar
        open={open}
        onClose={onClose}
        autoHideDuration={8000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="warning"
          onClose={onClose}
          action={
            <Button
              color="inherit"
              size="small"
              variant="outlined"
              sx={{ whiteSpace: 'nowrap' }}
              onClick={() => {
                onClose();
                navigate('/settings');
              }}
            >
              {t('settings_cdse_title')}
            </Button>
          }
        >
          {t('err_CDSE_NOT_CONNECTED')}
        </Alert>
      </Snackbar>
    </Portal>
  );
} 