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
  navOpen?: boolean;
  onNavClose?: () => void;
}

export default function NavDrawer({ open, onClose, isMobile, drawerWidth, navOpen = true, onNavClose }: NavDrawerProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = (path: string) => {
    navigate(path);
    if (isMobile) onClose();
    else onNavClose?.();
  };

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar />
      <Divider />
      <List sx={{ flexGrow: 1 }}>
        {NAV_ITEMS.map(({ label, path, icon }) => (
          <ListItem key={path} disablePadding>
            <ListItemButton
              selected={location.pathname === path}
              onClick={() => handleClick(path)}
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
          </ListItem>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" color="text.secondary">NDVI Monitor v0.1</Typography>
      </Box>
    </Box>
  );

  // Mobiili: temporary drawer (liu'uttaa sivulta, sulkeutuu taustaa klikkaamalla)
  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{ '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' } }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  // Desktop: permanent drawer joka liukuu CSS transform -animaatiolla.
  // Aiempi Collapse + permanent -yhdistelmä aiheutti layout-ongelmia
  // (z-index, DOM:iin jäävä drawer kun leveys = 0). Nyt Drawer pysyy
  // DOM:issa ja Paper siirtyy translateX:llä ruudun ulkopuolelle.
  // AppLayout laskee effectiveLeft tämän mukaan (navOpen ? DRAWER_WIDTH : 0).
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: navOpen ? drawerWidth : 0,
        flexShrink: 0,
        transition: 'width 0.2s ease',
        // overflow:hidden estää drawerin sisällön näkymisen siirron aikana
        overflow: 'hidden',
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          transform: navOpen ? 'translateX(0)' : `translateX(-${drawerWidth}px)`,
          transition: 'transform 0.2s ease',
          // Varmistaa ettei drawer näy AppBarin päällä animoinnin aikana
          visibility: navOpen ? 'visible' : 'hidden',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}
