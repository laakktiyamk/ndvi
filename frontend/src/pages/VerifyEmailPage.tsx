import { useEffect, useRef, useState } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Alert, Box, CircularProgress, Container, Link, Typography } from '@mui/material';
import { verifyEmail } from '../services/authService';
import { getApiErrorMessage } from '../utils/apiError';

type Status = 'loading' | 'success' | 'error';

export default function VerifyEmailPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<Status>(token ? 'loading' : 'error');
  const [error, setError] = useState<string | null>(token ? null : t('verify_failed'));
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;

    // Poistetaan token osoiterivistä, ettei se jää selainhistoriaan
    window.history.replaceState({}, '', window.location.pathname);

    verifyEmail(token)
      .then(() => setStatus('success'))
      .catch((err) => {
        setError(getApiErrorMessage(err, t));
        setStatus('error');
      });
  }, [token, t]);

  return (
    <Container maxWidth="xs" sx={{ mt: 8 }}>
      {status === 'loading' && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={24} />
          <Typography>{t('verify_loading')}</Typography>
        </Box>
      )}

      {status === 'success' && (
        <Alert severity="success">{t('verify_success')}</Alert>
      )}

      {status === 'error' && (
        <Alert severity="error">{error ?? t('verify_failed')}</Alert>
      )}

      {status !== 'loading' && (
        <Box sx={{ mt: 2 }}>
          <Link component={RouterLink} to="/login">
            {t('verify_go_login')}
          </Link>
        </Box>
      )}
    </Container>
  );
}