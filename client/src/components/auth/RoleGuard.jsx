import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getLoginPathForDestination,
  getRoleBasedRedirect,
  hasAdminPanelAccess,
} from '../../lib/auth';
import AuthLoadingScreen from './AuthLoadingScreen';

/**
 * Role-aware route gate.
 * - Unauthenticated → role-appropriate login with return URL
 * - Authenticated but wrong role → role home (never logout)
 */
function RoleGuard({
  children,
  allowRoles = [],
  requireAdminPanel = false,
  loginPath,
}) {
  const { currentUser, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  if (!currentUser) {
    const dest = loginPath || getLoginPathForDestination(location.pathname);
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`${dest}?redirect=${redirect}`} replace />;
  }

  const roleOk = !allowRoles.length || allowRoles.includes(currentUser.role);
  const panelOk = !requireAdminPanel || hasAdminPanelAccess(currentUser);

  if (!roleOk || !panelOk) {
    return <Navigate to={getRoleBasedRedirect(currentUser)} replace />;
  }

  return children;
}

export default RoleGuard;
