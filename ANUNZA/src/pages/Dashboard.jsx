import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { FeedSection } from '../components/feed/FeedSection';
import { ChatSection } from '../components/ChatSection';
import { HistorialSection } from '../components/HistorialSection';
import { ProfileSection } from '../components/ProfileSection';
import './Dashboard.css';

export const Dashboard = () => {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState('inicio');
  const [chatBootstrapUserId, setChatBootstrapUserId] = useState(null);
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    setProfileError('');
  }, [activeSection]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard anunza-dashboard">
      <Navbar user={user} onLogout={handleLogout} onOpenProfile={() => setActiveSection('perfil')} />

      <div className="dashboard-body">
        <aside className="sidebar anunza-sidebar">
          <nav className="sidebar-nav">
            <ul>
              <li
                className={activeSection === 'inicio' ? 'active' : ''}
                onClick={() => setActiveSection('inicio')}
                role="presentation"
              >
                Inicio
              </li>
              <li
                className={activeSection === 'mensajes' ? 'active' : ''}
                onClick={() => setActiveSection('mensajes')}
                role="presentation"
              >
                Mensajes
              </li>
              <li
                className={activeSection === 'historial' ? 'active' : ''}
                onClick={() => setActiveSection('historial')}
                role="presentation"
              >
                Mi historial
              </li>
              <li
                className={activeSection === 'perfil' ? 'active' : ''}
                onClick={() => setActiveSection('perfil')}
                role="presentation"
              >
                Perfil
              </li>
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
              onChatWithUser={(uid) => {
                setChatBootstrapUserId(uid);
                setActiveSection('mensajes');
              }}
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
            <ProfileSection
              user={user}
              updateProfile={updateProfile}
              onError={setProfileError}
            />
          )}
        </main>
      </div>
    </div>
  );
};
