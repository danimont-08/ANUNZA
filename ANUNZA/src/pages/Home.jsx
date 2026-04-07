import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Home - Solo lógica de redirección
 */
export const Home = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    // Mientras se verifica el estado de autenticación, se puede retornar null o un spinner mínimo
    return null; // O un <div>Cargando...</div> muy simple
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
};