import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box, Paper, Typography, TextField,
  Button, Alert, CircularProgress, Link, Divider,
  ToggleButton, ToggleButtonGroup, Stack
} from '@mui/material';
import GrassIcon from '@mui/icons-material/Grass';
import { login } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { getApiErrorMessage } from '../utils/apiError';

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await login(email, password);
      setAuth(res.data.token, res.data.user);
      navigate('/');
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, t));
    } finally {
      setLoading(false);
    }
  };

  const currentLang = i18n.language.startsWith('fi') ? 'fi' : 'en';

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: 'background.default',
      p: 2,
    }}>
      <Paper sx={{ p: 4, width: '100%', maxWidth: 400 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <GrassIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, flexGrow: 1 }}>NDVI Monitor</Typography>
          <ToggleButtonGroup
            value={currentLang}
            exclusive
            onChange={(_, lang) => lang && i18n.changeLanguage(lang)}
            size="small"
          >
            <ToggleButton value="fi">FI</ToggleButton>
            <ToggleButton value="en">EN</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <Typography variant="h6" sx={{ mb: 3 }}>{t('login')}</Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label={t('email')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required fullWidth autoFocus
              autoComplete="email"
            />
            <TextField
              label={t('password')}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required fullWidth
              autoComplete="current-password"
            />
            {error && <Alert severity="error">{error}</Alert>}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
            >
              {loading ? '...' : t('login')}
            </Button>
          </Box>
        </Box>
        <Divider sx={{ my: 3 }} />
        <Stack direction="row" spacing={2} sx={{ justifyContent: 'center', alignItems: 'center' }}>
          <Link component={RouterLink} to="/forgot-password" variant="body2">
            {t('login_forgot_link')}
          </Link>
          <Button component={RouterLink} to="/register" size="small" variant="outlined">
            {t('register')}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}