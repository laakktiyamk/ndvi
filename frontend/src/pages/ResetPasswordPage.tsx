import { useState } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Button, Container, Link, TextField, Typography } from '@mui/material';
import { resetPassword } from '../services/authService';
import { getApiErrorMessage } from '../utils/apiError';

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!token) return;
    if (password !== confirm) {
      setError(t('reset_passwords_mismatch'));
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(getApiErrorMessage(err, t));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 8 }}>
      <Typography variant="h5" component="h1" gutterBottom>
        {t('reset_title')}
      </Typography>

      {!token ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {t('reset_missing_token')}
        </Alert>
      ) : done ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          {t('reset_success')}
        </Alert>
      ) : (
        <Box component="form" onSubmit={handleSubmit} noValidate>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            label={t('reset_new_password')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            required
            autoFocus
            margin="normal"
            autoComplete="new-password"
          />
          <TextField
            label={t('reset_confirm_password')}
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            fullWidth
            required
            margin="normal"
            autoComplete="new-password"
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading || !password || !confirm}
            sx={{ mt: 2 }}
          >
            {t('reset_submit')}
          </Button>
        </Box>
      )}

      <Box sx={{ mt: 2 }}>
        <Link component={RouterLink} to={!token ? '/forgot-password' : '/login'}>
          {t(!token ? 'forgot_title' : 'forgot_back_to_login')}
        </Link>
      </Box>
    </Container>
  );
}