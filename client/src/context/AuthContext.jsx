import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import apiRequest from '../lib/apiRequest';
import {
  AUTH_EVENTS,
  clearAuthStorage,
  getRoleBasedRedirect,
  hasAdminPanelAccess,
  ROLES,
} from '../lib/auth';

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(() => {
    setCurrentUser(null);
    clearAuthStorage();
  }, []);

  const updateUser = useCallback((user, token) => {
    if (user && token) {
      setCurrentUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
    } else {
      clearSession();
    }
  }, [clearSession]);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      clearSession();
      return null;
    }

    try {
      const res = await apiRequest.get('/auth/me');
      const user = res.data?.user;
      if (!user) {
        clearSession();
        return null;
      }
      setCurrentUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch {
      clearSession();
      return null;
    }
  }, [clearSession]);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      const token = localStorage.getItem('token');
      const cached = localStorage.getItem('user');

      if (!token || !cached) {
        clearAuthStorage();
        if (!cancelled) {
          setCurrentUser(null);
          setIsLoading(false);
        }
        return;
      }

      // Optimistic paint from cache, then revalidate against backend (source of truth).
      try {
        if (!cancelled) setCurrentUser(JSON.parse(cached));
      } catch {
        clearAuthStorage();
        if (!cancelled) setCurrentUser(null);
      }

      try {
        const res = await apiRequest.get('/auth/me');
        const user = res.data?.user;
        if (!user) {
          clearAuthStorage();
          if (!cancelled) setCurrentUser(null);
        } else if (!cancelled) {
          setCurrentUser(user);
          localStorage.setItem('user', JSON.stringify(user));
        }
      } catch {
        clearAuthStorage();
        if (!cancelled) setCurrentUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onUnauthorized = () => {
      clearSession();
    };
    window.addEventListener(AUTH_EVENTS.UNAUTHORIZED, onUnauthorized);
    return () => window.removeEventListener(AUTH_EVENTS.UNAUTHORIZED, onUnauthorized);
  }, [clearSession]);

  const logout = useCallback(async () => {
    try {
      await apiRequest.post('/auth/logout');
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const isAdmin = useCallback(
    (user = currentUser) => user?.role === ROLES.ADMIN,
    [currentUser]
  );

  const isAgent = useCallback(
    (user = currentUser) => user?.role === ROLES.AGENT,
    [currentUser]
  );

  const isStaff = useCallback(
    (user = currentUser) => user?.role === ROLES.STAFF,
    [currentUser]
  );

  const isUser = useCallback(
    (user = currentUser) => user?.role === ROLES.USER,
    [currentUser]
  );

  const canAccessAdminPanel = useCallback(
    (user = currentUser) => hasAdminPanelAccess(user),
    [currentUser]
  );

  const getRoleRedirect = useCallback(
    (user = currentUser) => getRoleBasedRedirect(user),
    [currentUser]
  );

  const isAuthenticated = useCallback(
    () => !!currentUser && !!localStorage.getItem('token'),
    [currentUser]
  );

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        user: currentUser,
        updateUser,
        logout,
        refreshUser,
        isAdmin,
        isAgent,
        isStaff,
        isUser,
        canAccessAdminPanel,
        getRoleRedirect,
        getRoleBasedRedirect: getRoleRedirect,
        isAuthenticated,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthContextProvider');
  }
  return context;
};

export default AuthContext;
