import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Drawer, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Box, Typography, Tooltip, Divider,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LayersIcon from '@mui/icons-material/Layers';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutlined';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import BarChartIcon from '@mui/icons-material/BarChart';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store/appStore';
import NewFieldDialog from './NewFieldDialog';

const DRAWER_WIDTH = 240;

interface NavItem {
  labelKey: string;
  icon: React.ReactNode;
  path: string;
  requiresField?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { labelKey: 'dashboard', icon: <DashboardIcon />, path: '/' },
  { labelKey: 'fields',    icon: <LayersIcon />,    path: '/fields' },
  { labelKey: 'weather',   icon: <WbSunnyIcon />,   path: '/weather',  requiresField: true },
  { labelKey: 'analysis',  icon: <BarChartIcon />,  path: '/analysis', requiresField: true },
];

interface Props {
  open: boolean;
  onClose: () => void;
  isMobile: boolean;
  drawerWidth: number;
  navOpen: boolean;
  onNavClose: () => void;
  onNavOpen: () => void;
}

export default function NavDrawer({ open, onClose, isMobile, navOpen, onNavOpen }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedFieldId, activeGeometryHash } = useAppStore();
  const hasField = !!(selectedFieldId || activeGeometryHash);

  const [newFieldOpen, setNewFieldOpen] = useState(false);

  const handleNavClick = (path: string) => {
    if (path === '/fields') {
      navigate(path, { state: { openList: true } });
    } else {
      navigate(path);
    }
    if (isMobile) onClose();
    else onNavOpen();
  };

  const handleNewField = () => {
    setNewFieldOpen(true);
    if (isMobile) onClose();
  };

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ height: 64 }} /> {/* AppBar offset */}
      <List sx={{ flexGrow: 1, pt: 1 }}>

        {/* Uusi pelto -nappi — aina ensimmäisenä, ei disabled */}
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleNewField}
            sx={{
              borderRadius: 1, mx: 1,
              color: 'primary.main',
              '& .MuiListItemIcon-root': { color: 'primary.main' },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <AddCircleOutlineIcon />
            </ListItemIcon>
            <ListItemText
              primary={t('newField') || 'Uusi pelto'}
              primaryTypographyProps={{ fontWeight: 600 }}
            />
          </ListItemButton>
        </ListItem>

        <Divider sx={{ my: 0.5, mx: 2 }} />

        {/* Muut navigointilinkit */}
        {NAV_ITEMS.map((item) => {
          const disabled = item.requiresField && !hasField;
          const selected = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));

          const button = (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                selected={selected}
                disabled={disabled}
                onClick={() => handleNavClick(item.path)}
                sx={{ borderRadius: 1, mx: 1 }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={t(item.labelKey)} />
              </ListItemButton>
            </ListItem>
          );

          return disabled ? (
            <Tooltip key={item.path} title={t('selectFieldFirst')} placement="right" arrow>
              <span>{button}</span>
            </Tooltip>
          ) : button;
        })}
      </List>

      <Box sx={{ p: 2, pb: 3 }}>
        <Typography variant="caption" color="text.secondary">NDVI Monitor v0.1</Typography>
      </Box>

      {/* NewFieldDialog renderöidään drawerin sisällä jotta pysyy oikein mobiililla */}
      <NewFieldDialog open={newFieldOpen} onClose={() => setNewFieldOpen(false)} />
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' } }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="persistent"
      open={navOpen}
      sx={{
        width: navOpen ? DRAWER_WIDTH : 0,
        flexShrink: 0,
        transition: 'width 0.2s ease',
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          transition: 'transform 0.2s ease',
          transform: navOpen ? 'translateX(0)' : `translateX(-${DRAWER_WIDTH}px)`,
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}
