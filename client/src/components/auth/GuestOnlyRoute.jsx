import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { resolvePostLoginRedirect } from '../../lib/auth';
import AuthLoadingScreen from './AuthLoadingScreen';

/**
 * Wraps login pages: if already authenticated, send user to role home
 * (or a validated ?redirect= target).
 */
function GuestOnlyRoute({ children }) {
  const { currentUser, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <AuthLoadingScreen message="Preparing sign-in…" />;
  }

  if (currentUser) {
    const params = new URLSearchParams(location.search);
    const target = resolvePostLoginRedirect(currentUser, params.get('redirect'));
    return <Navigate to={target} replace />;
  }

  return children;
}

export default GuestOnlyRoute;
