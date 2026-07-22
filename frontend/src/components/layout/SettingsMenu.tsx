import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  IconButton, Menu, MenuItem,
  ListItemIcon, ListItemText, Divider, Tooltip,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import LanguageIcon from '@mui/icons-material/Language';

interface Props {
  themeMode: 'light' | 'dark';
  onToggleTheme: () => void;
}

export default function SettingsMenu({ themeMode, onToggleTheme }: Props) {
  const { t, i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClose = () => setAnchorEl(null);

  const toggleLang = () => {
    const next = i18n.language === 'fi' ? 'en' : 'fi';
    i18n.changeLanguage(next);
    localStorage.setItem('ndvi-lang', next);
    handleClose();
  };

  return (
    <>
      <Tooltip title={t('settings')}>
        <IconButton
          color="inherit"
          onClick={(e) => setAnchorEl(e.currentTarget)}
          aria-label={t('settings')}
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
        <MenuItem onClick={() => { onToggleTheme(); handleClose(); }}>
          <ListItemIcon>
            {themeMode === 'dark'
              ? <Brightness7Icon fontSize="small" />
              : <Brightness4Icon fontSize="small" />}
          </ListItemIcon>
          <ListItemText primary={themeMode === 'dark' ? t('lightMode') : t('darkMode')} />
        </MenuItem>
        <MenuItem onClick={toggleLang}>
          <ListItemIcon><LanguageIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary={t('language')} />
        </MenuItem>
        <Divider />
      </Menu>
    </>
  );
}
