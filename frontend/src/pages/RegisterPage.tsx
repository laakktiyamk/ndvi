import { useState } from 'react';
import { useTranslation } from 'react-i18next';
//import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box, Paper, Typography, TextField,
  Button, Alert, CircularProgress, Link, Divider,
  ToggleButton, ToggleButtonGroup, Collapse,
} from '@mui/material';
import GrassIcon from '@mui/icons-material/Grass';
import { register } from '../services/authService';
import { getApiErrorMessage } from '../utils/apiError';
import PasswordRequirements, { isPasswordValid } from '../components/PasswordRequirements';

export default function RegisterPage() {
  const { t, i18n } = useTranslation();
  //const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [pwFocused, setPwFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sentTo, setSentTo] = useState<string | null>(null);
  const currentLang = i18n.language.startsWith('fi') ? 'fi' : 'en';

  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid(password)) { setError(t('pw_rules_not_met')); return; }
    if (password !== password2) { setError(t('passwordMismatch')); return; }
    setLoading(true);
    setError(null);
    try {       
      await register(email, password, username, clientId, clientSecret, currentLang);
      setSentTo(email);      
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, t));    
    } finally {
      setLoading(false);
    }
  };

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
        <Typography variant="h6" sx={{ mb: 3 }}>{t('register')}</Typography>
        
        {sentTo ? (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
    <Alert severity="success">{t('verifyEmailSent', { email: sentTo })}</Alert>
    <Button component={RouterLink} to="/login" variant="contained" fullWidth>
      {t('login')}
    </Button>
  </Box>
) : (
        <Box component="form" onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label={t('username')}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required fullWidth autoFocus
              autoComplete="username"
            />
            <TextField
              label={t('email')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required fullWidth
              autoComplete="email"
            />
            <TextField
              label={t('password')}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setPwFocused(true)}
              onBlur={() => setPwFocused(false)}
              required fullWidth
              autoComplete="new-password"
            />
            <Collapse in={pwFocused || password.length > 0} unmountOnExit>
              <PasswordRequirements password={password} />
            </Collapse>
            <TextField
              label={t('passwordAgain')}
              type="password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              required fullWidth
              autoComplete="new-password"
            />
            <Alert severity="info">
              {t('cdseInfo')}{' '}
              <Link
                href="https://shapps.dataspace.copernicus.eu/dashboard/"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('cdseInfoLink')}
              </Link>
            </Alert>
            <TextField
              label={t('cdseClientId')}
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required fullWidth
              autoComplete="off"
            />
            <TextField
              label={t('cdseClientSecret')}
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              required fullWidth
              autoComplete="off"
            />
            {error && <Alert severity="error">{error}</Alert>}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
            >
              {loading ? '...' : t('register')}
            </Button>
          </Box>
        </Box>)}
        <Divider sx={{ my: 3 }} />
        <Typography variant="body2" sx={{ textAlign: 'center' }}>
          <Link component={RouterLink} to="/login">{t('login')}</Link>
        </Typography>
      </Paper>
    </Box>
  );
}