import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { LoadingState } from './ui';

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingState />;
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  return <Outlet />;
}
