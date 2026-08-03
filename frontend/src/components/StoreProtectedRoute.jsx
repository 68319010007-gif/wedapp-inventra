import { Navigate, useLocation } from 'react-router-dom';
import { useStoreAuth } from '../store/StoreAuthContext';
import { LoadingState } from './ui';

export default function StoreProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useStoreAuth();
  const location = useLocation();

  if (loading) return <LoadingState />;
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return children;
}
