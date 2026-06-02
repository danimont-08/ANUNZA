import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import './context/ToastContext.css';
import './dark-mode.css';
import './animations.css';
import { PrivateRoute } from './components/PrivateRoute';
import { AdminRoute } from './components/AdminRoute';
import { ModeradorRoute } from './components/ModeradorRoute';

// Carga inmediata — pantallas de acceso público (pequeñas)
import { Home } from './pages/Home';
import { FormularioLogin } from './components/FormularioLogin';
import { FormularioRegistro } from './components/FormularioRegistro';
import { ConfirmarCorreo } from './pages/ConfirmarCorreo';

// Lazy — solo se cargan cuando el usuario navega a esa ruta
const Dashboard          = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const UserPublicProfile  = lazy(() => import('./pages/UserPublicProfile').then(m => ({ default: m.UserPublicProfile })));
const AdminLayout        = lazy(() => import('./pages/admin/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AdminDashboard     = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminUsers         = lazy(() => import('./pages/admin/AdminUsers').then(m => ({ default: m.AdminUsers })));
const AdminReports       = lazy(() => import('./pages/admin/AdminReports').then(m => ({ default: m.AdminReports })));
const ModeradorLayout    = lazy(() => import('./pages/moderador/ModeradorLayout').then(m => ({ default: m.ModeradorLayout })));
const PublicacionPage    = lazy(() => import('./pages/PublicacionPage').then(m => ({ default: m.PublicacionPage })));

import './App.css';

function PageLoader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: '#f5f2ff',
      fontSize: '0.9rem', color: '#8a4eff', fontFamily: 'sans-serif',
    }}>
      Cargando…
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
        <ToastProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<FormularioLogin />} />
            <Route path="/register" element={<FormularioRegistro />} />
            <Route path="/confirmar-correo" element={<ConfirmarCorreo />} />

            <Route
              path="/dashboard"
              element={<PrivateRoute><Dashboard /></PrivateRoute>}
            />

            <Route
              path="/perfil/:userId"
              element={<PrivateRoute><UserPublicProfile /></PrivateRoute>}
            />

            <Route
              path="/pub/:pubId"
              element={<PrivateRoute><PublicacionPage /></PrivateRoute>}
            />

            <Route
              path="/admin"
              element={<AdminRoute><AdminLayout /></AdminRoute>}
            >
              <Route index element={<AdminDashboard />} />
              <Route path="usuarios" element={<AdminUsers />} />
              <Route path="reportes" element={<AdminReports />} />
            </Route>

            <Route
              path="/moderador"
              element={<ModeradorRoute><ModeradorLayout /></ModeradorRoute>}
            >
              <Route index element={<AdminDashboard />} />
              <Route path="usuarios" element={<AdminUsers />} />
              <Route path="reportes" element={<AdminReports />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
