import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useState, useEffect } from 'react';

export default function ProtectedRoute() {
  const { isAuthenticated } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}