import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { FeedSection } from '../components/feed/FeedSection';
import { ChatSection } from '../components/ChatSection';
import { HistorialSection } from '../components/HistorialSection';
import { ProfileSection } from '../components/ProfileSection';
import { NotificacionesPanel } from '../components/NotificacionesPanel';
import { fetchNotificaciones } from '../models/notificacionModel';
import './Dashboard.css';

const IconHome = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 9.5L12 3l9 6.5V21a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
    <path d="M9 22V12h6v10"/>
  </svg>
);
const IconChat = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const IconHistory = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IconProfile = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="8" r="4"/>
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>
);

const NAV_ITEMS = [
  { key: 'inicio',    label: 'Inicio',    Icon: IconHome    },
  { key: 'mensajes',  label: 'Mensajes',  Icon: IconChat    },
  { key: 'historial', label: 'Historial', Icon: IconHistory },
  { key: 'perfil',    label: 'Perfil',    Icon: IconProfile },
];

export const Dashboard = () => {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeSection, setActiveSection]             = useState('inicio');
  const [chatBootstrapUserId, setChatBootstrapUserId] = useState(null);
  const [chatBootstrapPublicacionId, setChatBootstrapPublicacionId] = useState(null);
  const [chatBootstrapConvId, setChatBootstrapConvId] = useState(null);
  const [feedHighlightId, setFeedHighlightId] = useState(null);
  const [profileError, setProfileError] = useState('');
  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const pollRef = useRef(null);

  useEffect(() => { setProfileError(''); }, [activeSection]);

  // Abrir sección específica al navegar desde otro panel (ej: notif desde admin)
  useEffect(() => {
    const { openSection, bootstrapConvId, highlightId } = location.state || {};
    if (!openSection) return;
    setActiveSection(openSection);
    if (bootstrapConvId) {
      setChatBootstrapConvId(bootstrapConvId);
      setChatBootstrapUserId(null);
      setChatBootstrapPublicacionId(null);
    }
    if (highlightId) {
      setFeedHighlightId(highlightId);
    }
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.state?.openSection, location.pathname, navigate]);

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

  const handleLogout = () => { logout(); navigate('/login'); };

  const handleToggleNotif = () => {
    setShowNotifPanel((v) => !v);
    if (!showNotifPanel) loadNotificaciones();
  };

  /**
   * Navega a la sección adecuada según el tipo de notificación:
   * - nuevo_mensaje  → mensajes, abre la conversación referencia_id
   * - comentario / me_gusta → inicio, resalta publicación referencia_id
   * - reporte        → moderación (sólo moderadores)
   */
  const handleNotifNavigate = useCallback((notif) => {
    setShowNotifPanel(false);
    const { tipo, referencia_id } = notif;

    if (tipo === 'nuevo_mensaje') {
      setChatBootstrapConvId(referencia_id || null);
      setChatBootstrapUserId(null);
      setChatBootstrapPublicacionId(null);
      setActiveSection('mensajes');
    } else if (tipo === 'comentario' || tipo === 'me_gusta') {
      setFeedHighlightId(referencia_id || null);
      setActiveSection('inicio');
    } else if (tipo === 'reporte') {
      navigate('/moderador');
    }
  }, [navigate]);

  return (
    <div className="dashboard anunza-dashboard">
      <Navbar
        user={user}
        onLogout={handleLogout}
        onOpenProfile={() => setActiveSection('perfil')}
        noLeidas={noLeidas}
        onToggleNotificaciones={handleToggleNotif}
      />

      {showNotifPanel && (
        <div className="notif-panel-wrapper">
          <NotificacionesPanel
            notificaciones={notificaciones}
            onClose={() => setShowNotifPanel(false)}
            onRefresh={loadNotificaciones}
            onNavigate={handleNotifNavigate}
          />
        </div>
      )}

      <div className={`dashboard-body${activeSection === 'mensajes' ? ' dashboard-body--chat' : ''}`}>
        <aside className="sidebar anunza-sidebar">
          <nav className="sidebar-nav">
            <ul>
              {NAV_ITEMS.map(({ key, label, Icon }) => (
                <li
                  key={key}
                  className={activeSection === key ? 'active' : ''}
                  onClick={() => setActiveSection(key)}
                  role="presentation"
                >
                  <span className="nav-icon"><Icon /></span>
                  <span className="nav-label">{label}</span>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <main className="main-content anunza-main">
          {profileError && activeSection === 'perfil' && (
            <div className="dashboard-inline-err">{profileError}</div>
          )}
          {activeSection === 'inicio' && (
            <FeedSection
              user={user}
              highlightPublicacionId={feedHighlightId}
              onHighlightConsumed={() => setFeedHighlightId(null)}
              onChatWithUser={(uid, pubId) => {
                setChatBootstrapUserId(uid);
                setChatBootstrapPublicacionId(pubId ?? null);
                setChatBootstrapConvId(null);
                setActiveSection('mensajes');
              }}
            />
          )}
          {activeSection === 'mensajes' && (
            <ChatSection
              user={user}
              bootstrapOtroUsuarioId={chatBootstrapUserId}
              bootstrapPublicacionId={chatBootstrapPublicacionId}
              bootstrapConversacionId={chatBootstrapConvId}
              onBootstrapConsumed={() => {
                setChatBootstrapUserId(null);
                setChatBootstrapPublicacionId(null);
                setChatBootstrapConvId(null);
              }}
            />
          )}
          {activeSection === 'historial' && (
            <HistorialSection
              onNavigateToPost={(id) => {
                setFeedHighlightId(id);
                setActiveSection('inicio');
              }}
            />
          )}
          {activeSection === 'perfil' && (
            <ProfileSection
              user={user}
              updateProfile={updateProfile}
              onError={setProfileError}
              onNavigateToPost={(id) => {
                setFeedHighlightId(id);
                setActiveSection('inicio');
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
};
