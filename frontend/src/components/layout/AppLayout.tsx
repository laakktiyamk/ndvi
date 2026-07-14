import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import {
  AppBar, Box, IconButton, Toolbar,
  Typography, useMediaQuery, useTheme,
  Avatar, Tooltip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import NavDrawer from './NavDrawer';
import { useAuthStore } from '../../store/authStore';

const DRAWER_WIDTH = 240;
const APPBAR_HEIGHT = 64;

export default function AppLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(true);  // ← desktop collapse
  const { user, logout } = useAuthStore();

  const { fields, activeGeometryHash, ndviEntries } = useAppStore();
  const activeField = fields.find(f => f.id === activeGeometryHash);
  const activeFieldName = activeField?.name ?? (ndviEntries[0] as any)?.name ?? null;

  const effectiveLeft = isMobile ? 0 : navOpen ? DRAWER_WIDTH : 0;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1, borderRadius: 0 }}>
        <Toolbar>
          {isMobile ? (
            <IconButton color="inherit" edge="start" onClick={() => setDrawerOpen(true)} sx={{ mr: 1 }}>
              <MenuIcon />
            </IconButton>
          ) : (
            // Desktop: vipu navdrawerin avaamiseen/sulkemiseen
            <Tooltip title={navOpen ? 'Piilota valikko' : 'Näytä valikko'}>
              <IconButton color="inherit" edge="start" onClick={() => setNavOpen(v => !v)} sx={{ mr: 1 }}>
                {navOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
              </IconButton>
            </Tooltip>
          )}

          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'baseline', gap: 1.5, minWidth: 0 }}>
            <Typography variant="h6" noWrap sx={{ fontWeight: 700, flexShrink: 0 }}>
              🌿 NDVI Monitor
            </Typography>
            {activeFieldName && (
              <>
                <Typography variant="body2" color="inherit" sx={{ opacity: 0.5, flexShrink: 0 }}>
                  /
                </Typography>
                <Typography variant="body2" noWrap color="inherit" sx={{ opacity: 0.85, fontWeight: 500 }}>
                  {activeFieldName}
                </Typography>
              </>
            )}
          </Box>
          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ width: 28, height: 28, fontSize: 13, bgcolor: 'primary.dark' }}>
                {user.username?.[0]?.toUpperCase()}
              </Avatar>
              {!isMobile && (
                <Typography variant="body2" color="inherit">{user.username}</Typography>
              )}
              <IconButton color="inherit" onClick={logout} aria-label="Kirjaudu ulos" size="small">
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <NavDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        isMobile={isMobile}
        drawerWidth={DRAWER_WIDTH}
        navOpen={navOpen}
        onNavClose={() => setNavOpen(false)}
      />

      <Box
        component="main"
        sx={{
          position: 'fixed',
          top: `${APPBAR_HEIGHT}px`,
          left: `${effectiveLeft}px`,
          right: 0,
          bottom: 0,
          overflow: 'auto',
          bgcolor: 'background.default',
          p: { xs: 2, sm: 3 },
          transition: 'left 0.2s ease',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
