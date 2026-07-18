import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Toolbar, Divider, Typography, Box, Tooltip,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import GrassIcon from '@mui/icons-material/Grass';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import BarChartIcon from '@mui/icons-material/BarChart';
import MapIcon from '@mui/icons-material/Map';
import { useAppStore } from '../../store/appStore';

const NAV_ITEMS = [
  { label: 'Dashboard',    path: '/',          icon: <DashboardIcon />, requiresField: false },
  { label: 'Lohkot',       path: '/fields',    icon: <GrassIcon />,     requiresField: false },
  { label: 'GeoJSON-haku', path: '/geojson',   icon: <MapIcon />,       requiresField: false },
  { label: 'Sää',          path: '/weather',   icon: <WbSunnyIcon />,   requiresField: true  },
  { label: 'Analyysi',     path: '/analysis',  icon: <BarChartIcon />,  requiresField: true  },
];

interface NavDrawerProps {
  open: boolean;
  onClose: () => void;
  isMobile: boolean;
  drawerWidth: number;
  navOpen?: boolean;
  onNavClose?: () => void;
}

export default function NavDrawer({ open, onClose, isMobile, drawerWidth, navOpen = true, onNavClose }: NavDrawerProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedFieldId } = useAppStore();
  const hasField = Boolean(selectedFieldId);

  const handleClick = (path: string, disabled: boolean) => {
    if (disabled) return;
    navigate(path);
    if (isMobile) onClose();
    else onNavClose?.();
  };

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar />
      <Divider />
      <List sx={{ flexGrow: 1 }}>
        {NAV_ITEMS.map(({ label, path, icon, requiresField }) => {
          const disabled = requiresField && !hasField;
          const button = (
            <ListItemButton
              selected={location.pathname === path}
              onClick={() => handleClick(path, disabled)}
              disabled={disabled}
              sx={{
                mx: 1, mb: 0.5,
                borderRadius: 1,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'white',
                  '& .MuiListItemIcon-root': { color: 'white' },
                  '&:hover': { bgcolor: 'primary.dark' },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{icon}</ListItemIcon>
              <ListItemText primary={label} />
            </ListItemButton>
          );

          return (
            <ListItem key={path} disablePadding>
              {disabled ? (
                <Tooltip title="Valitse ensin lohko" placement="right" arrow>
                  <span style={{ width: '100%' }}>{button}</span>
                </Tooltip>
              ) : button}
            </ListItem>
          );
        })}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" color="text.secondary">NDVI Monitor v0.1</Typography>
      </Box>
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer variant="temporary" open={open} onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{ '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' } }}>
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <Drawer variant="permanent" sx={{
      width: navOpen ? drawerWidth : 0,
      flexShrink: 0,
      transition: 'width 0.2s ease',
      overflow: 'hidden',
      '& .MuiDrawer-paper': {
        width: drawerWidth,
        boxSizing: 'border-box',
        transform: navOpen ? 'translateX(0)' : `translateX(-${drawerWidth}px)`,
        transition: 'transform 0.2s ease',
        visibility: navOpen ? 'visible' : 'hidden',
      },
    }}>
      {drawerContent}
    </Drawer>
  );
}
