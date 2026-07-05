import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Toolbar, Divider, Typography, Box,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import GrassIcon from '@mui/icons-material/Grass';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import BarChartIcon from '@mui/icons-material/BarChart';
import MapIcon from '@mui/icons-material/Map';

const NAV_ITEMS = [
  { label: 'Dashboard',    path: '/',          icon: <DashboardIcon /> },
  { label: 'Lohkot',       path: '/fields',    icon: <GrassIcon />     },
  { label: 'GeoJSON-haku', path: '/geojson',   icon: <MapIcon />       },
  { label: 'Sää',          path: '/weather',   icon: <WbSunnyIcon />   },
  { label: 'Analyysi',     path: '/analysis',  icon: <BarChartIcon />  },
];

interface NavDrawerProps {
  open: boolean;
  onClose: () => void;
  isMobile: boolean;
  drawerWidth: number;
}

export default function NavDrawer({ open, onClose, isMobile, drawerWidth }: NavDrawerProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar />
      <Divider />
      <List sx={{ flexGrow: 1 }}>
        {NAV_ITEMS.map(({ label, path, icon }) => (
          <ListItem key={path} disablePadding>
            <ListItemButton
              selected={location.pathname === path}
              onClick={() => { navigate(path); if (isMobile) onClose(); }}
              sx={{
                mx: 1, mb: 0.5,
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
          </ListItem>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" color="text.secondary">NDVI Monitor v0.1</Typography>
      </Box>
    </Box>
  );

  return isMobile ? (
    <Drawer
      variant="temporary"
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' } }}
    >
      {drawerContent}
    </Drawer>
  ) : (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}
