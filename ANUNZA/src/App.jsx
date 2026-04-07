import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PrivateRoute } from './components/PrivateRoute';
import { Home } from './pages/Home';
import { FormularioLogin } from './components/FormularioLogin';
import { FormularioRegistro } from './components/FormularioRegistro';
import { Dashboard } from './pages/Dashboard';
import './App.css';

/**
 * Componente principal de la aplicación
 * Define las rutas y estructura general
 */
function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<FormularioLogin />} />
          <Route path="/register" element={<FormularioRegistro />} />

          {/* Ruta protegida - solo para usuarios autenticados */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />

          {/* Ruta por defecto */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
