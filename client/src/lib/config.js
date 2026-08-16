/**
 * Central API / Socket / asset configuration.
 *
 * Development (vite --mode development):
 *   Relative `/api` + Vite proxy → local API (default http://localhost:8800)
 *
 * Production build (vite build):
 *   Absolute production API host
 *
 * Override anytime with VITE_API_URL / VITE_SOCKET_URL.
 */

const trimSlash = (value = '') => String(value || '').replace(/\/$/, '');

const isDev = import.meta.env.DEV;
const isProd = import.meta.env.PROD;

const PROD_API = 'https://api.suretreaven.com/api';
const PROD_ORIGIN = 'https://api.suretreaven.com';

/**
 * REST base including `/api`.
 * Dev default: `/api` (proxied). Prod default: production API.
 */
export const API_BASE_URL = trimSlash(
  import.meta.env.VITE_API_URL ||
    (isProd ? PROD_API : '/api')
);

/**
 * Origin that hosts Socket.IO and static uploads (no trailing path).
 */
function resolveServerOrigin() {
  const socketEnv = trimSlash(import.meta.env.VITE_SOCKET_URL || '');
  if (socketEnv) return socketEnv;

  const api = API_BASE_URL;
  if (api.startsWith('http://') || api.startsWith('https://')) {
    return trimSlash(api.replace(/\/api$/i, ''));
  }

  // Relative API in browser → same origin (Vite proxy forwards /uploads)
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return isProd ? PROD_ORIGIN : '';
}

export const SERVER_ORIGIN = resolveServerOrigin();

/** Socket.IO connection URL */
export const SOCKET_URL =
  SERVER_ORIGIN ||
  (typeof window !== 'undefined' ? window.location.origin : '');

export const ENV_MODE = import.meta.env.MODE;
export const IS_DEV = isDev;
export const IS_PROD = isProd;

/**
 * Resolve a backend-relative path (e.g. `/uploads/logo.png`) to an absolute URL.
 * Absolute http(s) / data / blob URLs are returned unchanged.
 */
export function resolveAssetUrl(path) {
  if (!path) return '';
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('data:') ||
    path.startsWith('blob:')
  ) {
    return path;
  }
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${SERVER_ORIGIN}${normalized}`;
}

export default {
  API_BASE_URL,
  SERVER_ORIGIN,
  SOCKET_URL,
  ENV_MODE,
  IS_DEV,
  IS_PROD,
  resolveAssetUrl,
};
