import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getLoginPathForDestination,
  getRoleBasedRedirect,
} from '../../lib/auth';
import AuthLoadingScreen from './AuthLoadingScreen';

/**
 * Requires an authenticated session. Does not redirect until auth init finishes.
 * Optional `roles` / `requireAdminPanel` for role gates (prefer RoleGuard for clarity).
 */
function ProtectedRoute({
  children,
  roles,
  requireAdminPanel = false,
  fallbackPath,
}) {
  const { currentUser, isLoading, canAccessAdminPanel } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  if (!currentUser) {
    const loginPath = getLoginPathForDestination(location.pathname);
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`${loginPath}?redirect=${redirect}`} replace />;
  }

  if (requireAdminPanel && !canAccessAdminPanel(currentUser)) {
    return (
      <Navigate
        to={fallbackPath || getRoleBasedRedirect(currentUser)}
        replace
      />
    );
  }

  if (roles?.length && !roles.includes(currentUser.role)) {
    return (
      <Navigate
        to={fallbackPath || getRoleBasedRedirect(currentUser)}
        replace
      />
    );
  }

  return children;
}

export default ProtectedRoute;
