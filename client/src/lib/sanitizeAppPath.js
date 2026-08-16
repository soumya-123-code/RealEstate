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

  // Legacy aliases — /properties and /properties?… map to /list,
  // but /properties/:id is a property detail and must map to /property/:id
  if (link === '/properties' || link.startsWith('/properties?')) {
    link = link.replace(/^\/properties/, '/list');
  } else if (link.startsWith('/properties/')) {
    link = `/property/${link.slice('/properties/'.length)}`;
  }

  // Legacy query param name
  link = link.replace(/([?&])type=/, '$1propertyType=');

  // Known public destinations — anything else falls back (avoids soft 404s from CMS typos)
  const pathOnly = link.split('?')[0];
  const allowedExact = new Set([
    '/',
    '/list',
    '/explore',
    '/about',
    '/contact',
    '/blog',
    '/faq',
    '/privacy',
    '/terms',
    '/login',
    '/register',
    '/bookings',
    '/chat',
    '/profile',
  ]);
  const allowedPrefixes = ['/property/', '/blog/'];

  const isAllowed =
    allowedExact.has(pathOnly) ||
    allowedPrefixes.some((p) => pathOnly === p || pathOnly.startsWith(p));

  if (!isAllowed) return fallback;
  return link || fallback;
}

export default sanitizeAppPath;
