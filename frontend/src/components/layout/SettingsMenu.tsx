import { useState } from 'react';
import {
  IconButton, Menu, MenuItem,
  ListItemIcon, ListItemText, Divider, Tooltip,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import LanguageIcon from '@mui/icons-material/Language';
import { useAppStore } from '../../store/appStore';

// Yksinkertainen i18n ilman kirjastoa — tekstit kovakoodattu objektiin.
// Jos projektiin tulee myöhemmin i18next, nämä voi korvata t()-kutsuilla.
export const UI_TEXTS = {
  fi: {
    settings: 'Asetukset',
    darkMode: 'Tumma tila',
    lightMode: 'Vaalea tila',
    language: 'Switch to English',
    langCode: 'FI',
  },
  en: {
    settings: 'Settings',
    darkMode: 'Dark mode',
    lightMode: 'Light mode',
    language: 'Vaihda suomeksi',
    langCode: 'EN',
  },
} as const;

export type Lang = keyof typeof UI_TEXTS;

interface Props {
  themeMode: 'light' | 'dark';
  onToggleTheme: () => void;
  lang: Lang;
  onToggleLang: () => void;
}

export default function SettingsMenu({ themeMode, onToggleTheme, lang, onToggleLang }: Props) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const t = UI_TEXTS[lang];

  const handleClose = () => setAnchorEl(null);

  return (
    <>
      <Tooltip title={t.settings}>
        <IconButton
          color="inherit"
          onClick={(e) => setAnchorEl(e.currentTarget)}
          aria-label={t.settings}
          size="small"
        >
          <SettingsIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { minWidth: 180 } } }}
      >
        {/* Teema */}
        <MenuItem onClick={() => { onToggleTheme(); handleClose(); }}>
          <ListItemIcon>
            {themeMode === 'dark' ? <Brightness7Icon fontSize="small" /> : <Brightness4Icon fontSize="small" />}
          </ListItemIcon>
          <ListItemText primary={themeMode === 'dark' ? t.lightMode : t.darkMode} />
        </MenuItem>

        {/* Kieli */}
        <MenuItem onClick={() => { onToggleLang(); handleClose(); }}>
          <ListItemIcon>
            <LanguageIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={t.language} />
        </MenuItem>

        <Divider />

        {/* Kirjaudu ulos — hoidetaan AppLayoutissa, välitetään propseilla */}
      </Menu>
    </>
  );
}
