import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Button, Container, Link, TextField, Typography } from '@mui/material';
import { forgotPassword } from '../services/authService';
import { getApiErrorMessage } from '../utils/apiError';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await forgotPassword(email);
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
        {t('forgot_title')}
      </Typography>

      {done ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          {t('forgot_success')}
        </Alert>
      ) : (
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {t('forgot_intro')}
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            label={t('email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            required
            autoFocus
            margin="normal"
          />
          <Button type="submit" variant="contained" fullWidth disabled={loading || !email} sx={{ mt: 2 }}>
            {t('forgot_submit')}
          </Button>
        </Box>
      )}

      <Box sx={{ mt: 2 }}>
        <Link component={RouterLink} to="/login">
          {t('forgot_back_to_login')}
        </Link>
      </Box>
    </Container>
  );
}