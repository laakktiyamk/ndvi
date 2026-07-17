import { createTheme } from '@mui/material/styles';

// Teema luodaan dynaamisesti moden perusteella.
// Kutsutaan App.tsx:stä kun käyttäjä vaihtaa teemaa.
export const createAppTheme = (mode: 'light' | 'dark') =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: '#2E7D32',
        contrastText: '#fff',
      },
      secondary: {
        main: '#1565C0',
      },
      background: mode === 'light'
        ? { default: '#F5F5F5', paper: '#ffffff' }
        : { default: '#121212', paper: '#1e1e1e' },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", sans-serif',
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: { boxShadow: '0 1px 4px rgba(0,0,0,0.12)' },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: { textTransform: 'none', borderRadius: 8 },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { borderRadius: 8 },
        },
      },
    },
  });

// Vanhan nimen säilytys jotta muut importit eivät hajoa ennen päivitystä
export const theme = createAppTheme('light');

export type { Lang } from './SettingsMenu';
