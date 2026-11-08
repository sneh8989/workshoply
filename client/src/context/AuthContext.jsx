import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/auth.api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('workshoply_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('workshoply_token') || null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem('workshoply_token');
      if (storedToken) {
        try {
          const res = await authApi.getMe();
          setUser(res.data.user);
          localStorage.setItem('workshoply_user', JSON.stringify(res.data.user));
        } catch (error) {
          // If token verification failed and refresh failed, clear local state
          setUser(null);
          setToken(null);
          localStorage.removeItem('workshoply_token');
          localStorage.removeItem('workshoply_refresh_token');
          localStorage.removeItem('workshoply_user');
        }
      }
      setIsLoading(false);
    };

    restoreSession();
  }, []);

  const login = async (credentials) => {
    const res = await authApi.login(credentials);
    const { user: userData, accessToken, refreshToken } = res.data;
    setUser(userData);
    setToken(accessToken);
    localStorage.setItem('workshoply_token', accessToken);
    localStorage.setItem('workshoply_refresh_token', refreshToken);
    localStorage.setItem('workshoply_user', JSON.stringify(userData));
    return userData;
  };

  const register = async (userData) => {
    const res = await authApi.register(userData);
    const { user: newUser, accessToken, refreshToken } = res.data;
    setUser(newUser);
    setToken(accessToken);
    localStorage.setItem('workshoply_token', accessToken);
    localStorage.setItem('workshoply_refresh_token', refreshToken);
    localStorage.setItem('workshoply_user', JSON.stringify(newUser));
    return newUser;
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
    setToken(null);
    localStorage.removeItem('workshoply_token');
    localStorage.removeItem('workshoply_refresh_token');
    localStorage.removeItem('workshoply_user');
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('workshoply_user', JSON.stringify(updatedUser));
  };

  const isAuthenticated = Boolean(user && token);
  const isAdmin = Boolean(user && user.role === 'ADMIN');

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
        isAdmin,
        login,
        register,
        logout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
