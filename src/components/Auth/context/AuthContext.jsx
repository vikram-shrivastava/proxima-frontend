import React, { createContext, useState, useEffect } from 'react';
import apiClient from '../ApiClient';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const response = await apiClient.get(`${import.meta.env.VITE_BACKEND_BASE_URL}auth/me`);
          setUser(response.data);
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('accessToken');
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await apiClient.post(`${import.meta.env.VITE_BACKEND_BASE_URL}auth/login`, {
        email,
        password
      });
      const { accessToken } = response.data.data;
      localStorage.setItem('accessToken', accessToken);
      setUser(response.data.user);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setUser(null);
  };

  const value = {
    user,
    setUser,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
