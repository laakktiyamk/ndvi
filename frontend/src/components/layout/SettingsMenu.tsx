import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  IconButton, Menu, MenuItem,
  ListItemIcon, ListItemText, Divider, Tooltip,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import LanguageIcon from '@mui/icons-material/Language';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { About } from '../about/About';


interface Props {
  themeMode: 'light' | 'dark';
  onToggleTheme: () => void;
}

export default function SettingsMenu({ themeMode, onToggleTheme }: Props) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
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
        <MenuItem onClick={() => { navigate('/settings'); handleClose(); }}>
          <ListItemIcon><ManageAccountsIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary={t('settings_menu_account')} />
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { setAboutOpen(true); handleClose(); }}>
          <ListItemIcon><InfoOutlinedIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary={t('about')} />
        </MenuItem>
      </Menu>
      <About open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </>
  );
}