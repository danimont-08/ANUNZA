import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { API_URL, getStoredToken } from '../services/api';

const AuthContext = createContext(null);

/**
 * Sesión JWT: valida token contra /users/profile al cargar (evita sesión rota en localStorage).
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const clearSession = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }, []);

  useEffect(() => {
    const t = getStoredToken();
    if (!t) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${API_URL}/users/profile`, {
          headers: { Authorization: `Bearer ${t}` },
        });
        if (res.status === 403) {
          clearSession();
          return;
        }
        if (!res.ok) throw new Error('Sesión inválida');
        const data = await res.json();
        setUser(data.user);
        setToken(t);
        localStorage.setItem('user', JSON.stringify(data.user));
      } catch {
        clearSession();
      } finally {
        setLoading(false);
      }
    })();
  }, [clearSession]);

  const login = async (correo, password) => {
    try {
      setError(null);
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const err = new Error(errorData.message || 'Error en login');
        if (errorData.correo_no_confirmado) {
          err.correo_no_confirmado = true;
          err.correo = errorData.correo;
        }
        throw err;
      }

      const data = await response.json();

      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const register = async (nombre, correo, telefono, password, cedula, ciudad, latitud, longitud) => {
    try {
      setError(null);
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          correo,
          telefono,
          password,
          cedula,
          ciudad,
          latitud,
          longitud,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error en registro');
      }

      const data = await response.json();

      // Si requiere confirmación de correo, no iniciamos sesión
      if (data.needs_confirmation) return data;

      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = () => {
    setError(null);
    clearSession();
  };

  const updateProfile = async (id, payload) => {
    try {
      setError(null);
      const response = await fetch(`${API_URL}/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al actualizar perfil');
      }

      const data = await response.json();

      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const value = {
    user,
    token,
    loading,
    error,
    login,
    logout,
    register,
    updateProfile,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.rol === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};
