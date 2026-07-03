import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box, Paper, Typography, TextField,
  Button, Alert, CircularProgress, Link, Divider,
} from '@mui/material';
import GrassIcon from '@mui/icons-material/Grass';
import { register } from '../services/authService';

export default function RegisterPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== password2) {
      setError('Salasanat eivät täsmää');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await register(email, password, username);
      navigate('/login', { state: { registered: true } });
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('Rekisteröinti epäonnistui');
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
          <Typography variant="h5" fontWeight={700}>NDVI Monitor</Typography>
        </Box>

        <Typography variant="h6" mb={3}>Luo tili</Typography>

        <Box component="form" onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Käyttäjänimi"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              fullWidth
              autoFocus
              autoComplete="username"
            />
            <TextField
              label="Sähköposti"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              autoComplete="email"
            />
            <TextField
              label="Salasana"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              autoComplete="new-password"
            />
            <TextField
              label="Salasana uudelleen"
              type="password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              required
              fullWidth
              autoComplete="new-password"
            />

            {error && <Alert severity="error">{error}</Alert>}

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
            >
              {loading ? 'Rekisteröidään...' : 'Rekisteröidy'}
            </Button>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Typography variant="body2" textAlign="center">
          Onko jo tili?{' '}
          <Link component={RouterLink} to="/login">
            Kirjaudu
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}
