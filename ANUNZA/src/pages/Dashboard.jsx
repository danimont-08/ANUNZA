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
  { key: 'inicio',       label: 'Inicio' },
  { key: 'mensajes',     label: 'Mensajes' },
  { key: 'historial',   label: 'Mi historial' },
  { key: 'perfil',      label: 'Perfil' },
];

export const Dashboard = () => {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [activeSection, setActiveSection]       = useState('inicio');
  const [chatBootstrapUserId, setChatBootstrapUserId] = useState(null);
  const [profileError, setProfileError]         = useState('');
  const [notificaciones, setNotificaciones]     = useState([]);
  const [noLeidas, setNoLeidas]                 = useState(0);
  const [showNotifPanel, setShowNotifPanel]     = useState(false);
  const pollRef = useRef(null);

  useEffect(() => { setProfileError(''); }, [activeSection]);

  // Carga y polling de notificaciones cada 30 s
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
    if (!showNotifPanel) loadNotificaciones(); // refrescar al abrir
  };

  return (
    <div className="dashboard anunza-dashboard">
      {/* Navbar fija arriba con la campanita */}
      <Navbar
        user={user}
        onLogout={handleLogout}
        onOpenProfile={() => setActiveSection('perfil')}
        noLeidas={noLeidas}
        onToggleNotificaciones={handleToggleNotif}
      />

      {/* Panel de notificaciones (posicionado relativo al navbar) */}
      {showNotifPanel && (
        <div className="notif-panel-wrapper">
          <NotificacionesPanel
            notificaciones={notificaciones}
            onClose={() => setShowNotifPanel(false)}
            onRefresh={loadNotificaciones}
          />
        </div>
      )}

      <div className="dashboard-body">
        {/* Sidebar lateral fijo */}
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

        {/* Contenido principal con scroll propio */}
        <main className="main-content anunza-main">
          {profileError && activeSection === 'perfil' && (
            <div className="dashboard-inline-err">{profileError}</div>
          )}
          {activeSection === 'inicio' && (
            <FeedSection
              user={user}
              onChatWithUser={(uid) => { setChatBootstrapUserId(uid); setActiveSection('mensajes'); }}
            />
          )}
          {activeSection === 'mensajes' && (
            <ChatSection
              user={user}
              bootstrapOtroUsuarioId={chatBootstrapUserId}
              onBootstrapConsumed={() => setChatBootstrapUserId(null)}
            />
          )}
          {activeSection === 'historial' && <HistorialSection />}
          {activeSection === 'perfil' && (
            <ProfileSection user={user} updateProfile={updateProfile} onError={setProfileError} />
          )}
        </main>
      </div>
    </div>
  );
};
