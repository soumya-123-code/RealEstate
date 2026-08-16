import axios from 'axios';
import {
  AUTH_EVENTS,
  clearAuthStorage,
  getLoginPathForDestination,
} from './auth';
import { API_BASE_URL } from './config';

const apiRequest = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 30000,
});

apiRequest.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let handlingUnauthorized = false;

const isAuthEndpoint = (url = '') =>
  url.includes('/auth/me') ||
  url.includes('/auth/login') ||
  url.includes('/auth/verify') ||
  url.includes('/auth/logout') ||
  url.includes('/auth/preview') ||
  url.includes('/auth/register') ||
  url.includes('/auth/resend') ||
  url.includes('/auth/agent') ||
  url.includes('/auth/admin') ||
  url.includes('/auth/user');

apiRequest.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';

    if (status === 401 && !isAuthEndpoint(url)) {
      if (!handlingUnauthorized) {
        handlingUnauthorized = true;
        clearAuthStorage();
        window.dispatchEvent(new CustomEvent(AUTH_EVENTS.UNAUTHORIZED));

        const path = window.location.pathname;
        const isLoginPage =
          path === '/login' ||
          path === '/admin/login' ||
          path === '/agent/login' ||
          path === '/register';

        if (!isLoginPage) {
          const loginPath = getLoginPathForDestination(path);
          const redirect = encodeURIComponent(path + window.location.search);
          window.location.assign(`${loginPath}?redirect=${redirect}`);
        }

        setTimeout(() => {
          handlingUnauthorized = false;
        }, 1500);
      }
    }

    if (status === 403) {
      // Authenticated but not authorized — keep session; route guards decide destination.
      window.dispatchEvent(
        new CustomEvent(AUTH_EVENTS.FORBIDDEN, {
          detail: { message: error.response?.data?.message },
        })
      );
    }

    return Promise.reject(error);
  }
);

export default apiRequest;