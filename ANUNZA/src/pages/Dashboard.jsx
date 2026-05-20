import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { FeedSection } from '../components/feed/FeedSection';
import { ChatSection } from '../components/ChatSection';
import { HistorialSection } from '../components/HistorialSection';
import { ProfileSection } from '../components/ProfileSection';
import { NotificacionesPanel } from '../components/NotificacionesPanel';
import { fetchNotificaciones } from '../models/notificacionModel';
import './Dashboard.css';

const NAV_ITEMS = [
  { key: 'inicio',    label: 'Inicio' },
  { key: 'mensajes',  label: 'Mensajes' },
  { key: 'historial', label: 'Mi historial' },
  { key: 'perfil',    label: 'Perfil' },
];

export const Dashboard = () => {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();

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

      <div className="dashboard-body">
        <aside className="sidebar anunza-sidebar">
          <nav className="sidebar-nav">
            <ul>
              {NAV_ITEMS.map(({ key, label }) => (
                <li
                  key={key}
                  className={activeSection === key ? 'active' : ''}
                  onClick={() => setActiveSection(key)}
                  role="presentation"
                >
                  {label}
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
            <ProfileSection user={user} updateProfile={updateProfile} onError={setProfileError} />
          )}
        </main>
      </div>
    </div>
  );
};
