/**
 * Centralized authentication / authorization helpers.
 * Backend UserRole enum: ADMIN | AGENT | STAFF | USER
 * (USER is the customer role — there is no CUSTOMER enum.)
 */

export const ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  AGENT: 'AGENT',
  STAFF: 'STAFF',
  USER: 'USER',
});

export const hasAdminPanelAccess = (user) => {
  if (!user) return false;
  if (user.role === ROLES.ADMIN) return true;
  if (user.role !== ROLES.STAFF) return false;
  const permissions = Array.isArray(user.permissions) ? user.permissions : [];
  return !!user.canAccessAdminPanel || permissions.includes('ADMIN_PANEL');
};

/** ADMIN always; STAFF needs MANAGE_CMS (or *). */
export const canManageCms = (user) => {
  if (!user) return false;
  if (user.role === ROLES.ADMIN) return true;
  const permissions = Array.isArray(user.permissions) ? user.permissions : [];
  return permissions.includes('*') || permissions.includes('MANAGE_CMS');
};

/** Default post-login destination by role (single source of truth). */
export const getRoleBasedRedirect = (user) => {
  if (!user?.role) return '/';
  if (user.role === ROLES.ADMIN) return '/admin';
  if (user.role === ROLES.STAFF) {
    return hasAdminPanelAccess(user) ? '/admin' : '/';
  }
  if (user.role === ROLES.AGENT) return '/agent';
  return '/';
};

/** Login page to use when an unauthenticated user hits a protected area. */
export const getLoginPathForDestination = (destination = '/') => {
  const path = typeof destination === 'string' ? destination : '/';
  if (path.startsWith('/admin') || path.startsWith('/staff')) return '/admin/login';
  if (path.startsWith('/agent')) return '/agent/login';
  return '/login';
};

/**
 * Only allow same-origin relative paths. Blocks open redirects.
 * Returns null if unsafe / missing.
 */
export const sanitizeRedirectPath = (raw) => {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed.startsWith('/')) return null;
  if (trimmed.startsWith('//')) return null;
  if (trimmed.includes('://')) return null;
  if (trimmed.includes('\\')) return null;
  // Disallow protocol-relative and encoded tricks
  try {
    const decoded = decodeURIComponent(trimmed);
    if (decoded.startsWith('//') || decoded.includes('://')) return null;
  } catch {
    return null;
  }
  return trimmed;
};

/**
 * After login: honor ?redirect= only if the user's role may access that path.
 * Otherwise fall back to role default.
 */
export const resolvePostLoginRedirect = (user, requestedRedirect) => {
  const safe = sanitizeRedirectPath(requestedRedirect);
  if (!safe) return getRoleBasedRedirect(user);
  if (!canAccessPath(user, safe)) return getRoleBasedRedirect(user);
  return safe;
};

/** Whether the authenticated user may visit a frontend path. */
export const canAccessPath = (user, pathname) => {
  if (!user || !pathname) return false;
  const path = pathname.split('?')[0];

  // Admin / staff panel
  if (path.startsWith('/admin') && path !== '/admin/login') {
    return hasAdminPanelAccess(user);
  }
  if (path.startsWith('/staff')) {
    return hasAdminPanelAccess(user) || user.role === ROLES.STAFF;
  }

  // Agent portal
  if (path.startsWith('/agent') && path !== '/agent/login') {
    return user.role === ROLES.AGENT;
  }

  // Authenticated customer-area routes (any logged-in user)
  const authenticatedAny = [
    '/profile',
    '/profile/update',
    '/bookings',
    '/chat',
  ];
  if (authenticatedAny.some((p) => path === p || path.startsWith(`${p}/`))) {
    return true;
  }

  return true;
};

/** Paths that require any authenticated session. */
export const isAuthRequiredPath = (pathname) => {
  if (!pathname) return false;
  const path = pathname.split('?')[0];
  if (path.startsWith('/admin') && path !== '/admin/login') return true;
  if (path.startsWith('/staff')) return true;
  if (path.startsWith('/agent') && path !== '/agent/login') return true;
  return ['/profile', '/profile/update', '/bookings', '/chat'].some(
    (p) => path === p || path.startsWith(`${p}/`)
  );
};

export const clearAuthStorage = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
};

export const AUTH_EVENTS = Object.freeze({
  UNAUTHORIZED: 'suretreaven:auth:unauthorized',
  FORBIDDEN: 'suretreaven:auth:forbidden',
});
