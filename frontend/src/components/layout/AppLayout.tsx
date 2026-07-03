import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import {
  AppBar, Box, IconButton, Toolbar,
  Typography, useMediaQuery, useTheme,
  Button, Avatar,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import NavDrawer from './NavDrawer';
import { useAuthStore } from '../../store/authStore';

const DRAWER_WIDTH = 240;
const APPBAR_HEIGHT = 64;

export default function AppLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, logout } = useAuthStore();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1, borderRadius: 0 }}>
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setDrawerOpen(true)}
              sx={{ mr: 1 }}
              aria-label="Avaa valikko"
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" noWrap sx={{ flexGrow: 1, fontWeight: 700 }}>
            🌿 NDVI Monitor
          </Typography>

          {/* Käyttäjä + logout */}
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
      />

      <Box
        component="main"
        sx={{
          position: 'fixed',
          top: `${APPBAR_HEIGHT}px`,
          left: { xs: 0, md: `${DRAWER_WIDTH}px` },
          right: 0,
          bottom: 0,
          overflow: 'auto',
          bgcolor: 'background.default',
          p: { xs: 2, sm: 3 },
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
