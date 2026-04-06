import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, usersApi } from '../services/api';

const AuthContext = createContext(null);

export const ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  MEMBER: 'MEMBER',
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const data = await authApi.login(email, password);
      const newToken = data.accessToken;
      sessionStorage.setItem('token', newToken);
      setToken(newToken);

      // Fetch user info
      const me = await usersApi.getMe(newToken);
      setUser(me);
      return me;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  // Fetch user info on mount or token change
  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }

    let cancelled = false;
    usersApi
      .getMe(token)
      .then((me) => {
        if (!cancelled) {
          setUser(me);
        }
      })
      .catch(() => {
        if (!cancelled) {
          sessionStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const permissions = useMemo(() => {
    if (!user) return null;
    return {
      canViewRestaurants: [ROLES.ADMIN, ROLES.MANAGER, ROLES.MEMBER].includes(user.role),
      canCreateOrder: [ROLES.ADMIN, ROLES.MANAGER, ROLES.MEMBER].includes(user.role),
      canCheckout: [ROLES.ADMIN, ROLES.MANAGER].includes(user.role),
      canCancelOrder: [ROLES.ADMIN, ROLES.MANAGER].includes(user.role),
      canUpdatePayment: user.role === ROLES.ADMIN,
    };
  }, [user]);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      permissions,
      login,
      logout,
    }),
    [token, user, loading, permissions, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}