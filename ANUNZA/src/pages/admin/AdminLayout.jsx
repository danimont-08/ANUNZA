import React, { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { NotificacionesPanel } from '../../components/NotificacionesPanel';
import { fetchNotificaciones } from '../../models/notificacionModel';
import { DEFAULT_AVATAR } from '../../utils/constants';
import { usePageTransition } from '../../hooks/usePageTransition';
import logo from '../../assets/Logo_Anunza.png';
import '../../components/Navbar.css';
import './Admin.css';

const IconResumen = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="7" height="7" rx="1"/>
    <rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/>
    <rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
);

const IconUsuarios = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="9" cy="7" r="4"/>
    <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    <path d="M21 21v-2a4 4 0 0 0-3-3.85"/>
  </svg>
);

const IconReportes = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
    <line x1="4" y1="22" x2="4" y2="15"/>
  </svg>
);

const NAV_ITEMS = [
  { label: 'Resumen',  path: '',          Icon: IconResumen,  end: true },
  { label: 'Usuarios', path: '/usuarios', Icon: IconUsuarios, end: false },
  { label: 'Reportes', path: '/reportes', Icon: IconReportes, end: false },
];

export function AdminLayout({
  basePath = '/admin',
  brand = 'ANUNZA · Administración',
  panelConfig = {},
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const go = usePageTransition();
  const pollRef = useRef(null);

  const [notificaciones, setNotificaciones]   = useState([]);
  const [noLeidas, setNoLeidas]               = useState(0);
  const [showNotifPanel, setShowNotifPanel]   = useState(false);

  const loadNotificaciones = useCallback(async () => {
    try {
      const data = await fetchNotificaciones();
      setNotificaciones(data.notificaciones || []);
      setNoLeidas(data.no_leidas || 0);
    } catch { /* silencioso */ }
  }, []);

  useEffect(() => {
    loadNotificaciones();
    pollRef.current = setInterval(loadNotificaciones, 30_000);
    return () => clearInterval(pollRef.current);
  }, [loadNotificaciones]);

  const handleToggleNotif = () => {
    setShowNotifPanel((v) => !v);
    if (!showNotifPanel) loadNotificaciones();
  };

  const handleNotifNavigate = useCallback((notif) => {
    setShowNotifPanel(false);
    const { tipo, referencia_id } = notif;
    if (tipo === 'nuevo_mensaje') {
      navigate('/dashboard', { state: { openSection: 'mensajes', bootstrapConvId: referencia_id || null } });
    } else if (tipo === 'comentario' || tipo === 'me_gusta' || tipo === 'resena') {
      navigate('/dashboard', { state: { openSection: 'inicio', highlightId: referencia_id || null } });
    }
    // reportes: ya estamos en admin/moderador, no navegamos
  }, [navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="admin-root">
      <header className="anunza-navbar">
        <div className="anunza-navbar-inner">
          <Link to={basePath} className="anunza-navbar-brand">
            <img src={logo} alt="ANUNZA" className="anunza-navbar-logo" />
          </Link>
          <div className="anunza-navbar-actions">
            <button type="button" className="anunza-admin-link" onClick={() => go('/dashboard')}>Ir al feed</button>

            {/* Campanita de notificaciones */}
            <button
              type="button"
              className="anunza-notif-btn"
              onClick={handleToggleNotif}
              aria-label={`Notificaciones${noLeidas > 0 ? ` (${noLeidas} nuevas)` : ''}`}
              title="Notificaciones"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22"
                fill="none" stroke="#8a4eff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {noLeidas > 0 && (
                <span className="anunza-notif-badge">{noLeidas > 9 ? '9+' : noLeidas}</span>
              )}
            </button>

          </div>
        </div>
      </header>

      {showNotifPanel && (
        <div className="admin-notif-wrapper">
          <NotificacionesPanel
            notificaciones={notificaciones}
            onClose={() => setShowNotifPanel(false)}
            onRefresh={loadNotificaciones}
            onNavigate={handleNotifNavigate}
          />
        </div>
      )}

      <div className="admin-body">
        <div className="admin-sidebar">
          <nav className="admin-nav">
            {NAV_ITEMS.map(({ label, path, Icon, end }) => (
              <NavLink key={label} to={`${basePath}${path}`} end={end}>
                <span className="admin-nav-icon"><Icon /></span>
                <span className="admin-nav-label">{label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="admin-sidebar-footer">
            <button
              type="button"
              className="anunza-navbar-user sidebar-user-btn"
              onClick={() => navigate('/dashboard', { state: { openSection: 'perfil' } })}
            >
              <img src={user?.foto_perfil || DEFAULT_AVATAR} alt="" className="anunza-navbar-avatar" />
              <span className="anunza-navbar-name">{user?.nombre || 'Usuario'}</span>
            </button>
            <button type="button" className="anunza-navbar-logout" onClick={handleLogout}>
              Salir
            </button>
          </div>
        </div>
        <main className="admin-main">
          <Outlet context={{ panelConfig }} />
        </main>
      </div>
    </div>
  );
}
