/** Centralized frontend roles. Backend USER is the customer role. */
export const ROLES = Object.freeze({ CUSTOMER: 'USER', USER: 'USER', AGENT: 'AGENT', ADMIN: 'ADMIN' });
export const hasAdminPanelAccess = (user) => user?.role === ROLES.ADMIN;
export const canManageCms = (user) => user?.role === ROLES.ADMIN;
export const getRoleBasedRedirect = (user) => user?.role === ROLES.ADMIN ? '/admin' : user?.role === ROLES.AGENT ? '/agent' : '/';
export const getLoginPathForDestination = (destination = '/') => destination.startsWith('/admin') ? '/admin/login' : destination.startsWith('/agent') ? '/agent/login' : '/login';
export const sanitizeRedirectPath = (raw) => {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('://') || trimmed.includes('\\')) return null;
  try { const decoded = decodeURIComponent(trimmed); if (decoded.startsWith('//') || decoded.includes('://')) return null; } catch { return null; }
  return trimmed;
};
export const canAccessPath = (user, pathname) => {
  if (!user || !pathname) return false;
  const path = pathname.split('?')[0];
  if (path.startsWith('/admin') && path !== '/admin/login') return user.role === ROLES.ADMIN;
  if (path.startsWith('/agent') && path !== '/agent/login') return user.role === ROLES.AGENT;
  if (['/profile', '/profile/update', '/bookings', '/chat'].some((p) => path === p || path.startsWith(`${p}/`))) return true;
  return true;
};
export const resolvePostLoginRedirect = (user, requestedRedirect) => { const safe = sanitizeRedirectPath(requestedRedirect); return safe && canAccessPath(user, safe) ? safe : getRoleBasedRedirect(user); };
export const isAuthRequiredPath = (pathname) => {
  if (!pathname) return false;
  const path = pathname.split('?')[0];
  return (path.startsWith('/admin') && path !== '/admin/login') || (path.startsWith('/agent') && path !== '/agent/login') || ['/profile', '/profile/update', '/bookings', '/chat'].some((p) => path === p || path.startsWith(`${p}/`));
};
export const clearAuthStorage = () => { localStorage.removeItem('user'); localStorage.removeItem('token'); };
export const AUTH_EVENTS = Object.freeze({ UNAUTHORIZED: 'suretreaven:auth:unauthorized', FORBIDDEN: 'suretreaven:auth:forbidden' });
