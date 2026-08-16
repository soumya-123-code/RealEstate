/**
 * Map legacy / CMS paths onto real React Router routes.
 * Hero banners historically used /properties while the SPA uses /list.
 */
export function sanitizeAppPath(raw, fallback = '/list') {
  if (!raw || typeof raw !== 'string') return fallback;
  let link = raw.trim();

  if (!link.startsWith('/') || link.startsWith('//') || link.includes('://') || link.includes('\\')) {
    return fallback;
  }

  try {
    const decoded = decodeURIComponent(link);
    if (decoded.startsWith('//') || decoded.includes('://')) return fallback;
  } catch {
    return fallback;
  }

  // Legacy list alias
  if (
    link === '/properties' ||
    link.startsWith('/properties?') ||
    link.startsWith('/properties/')
  ) {
    link = link.replace(/^\/properties/, '/list');
  }

  // Legacy query param name
  link = link.replace(/([?&])type=/, '$1propertyType=');

  const pathOnly = link.split('?')[0];
  const allowedExact = new Set([
    '/',
    '/list',
    '/explore',
    '/about',
    '/contact',
    '/blog',
    '/faq',
    '/login',
    '/register',
    '/bookings',
    '/chat',
    '/profile',
  ]);

  // The property API and route both use an integer property ID.
  const propertyPath = pathOnly.match(/^\/property\/(\d+)$/);
  const blogPath = pathOnly.match(/^\/blog\/[^/]+$/);

  // Reject stale CMS links such as /property/undefined, /property/null,
  // nested legacy property paths, and malformed blog URLs before navigation.
  if (pathOnly.startsWith('/property/') && !propertyPath) return fallback;
  if (pathOnly.startsWith('/blog/') && !blogPath) return fallback;

  if (!allowedExact.has(pathOnly) && !propertyPath && !blogPath) return fallback;
  return link || fallback;
}

export default sanitizeAppPath;
