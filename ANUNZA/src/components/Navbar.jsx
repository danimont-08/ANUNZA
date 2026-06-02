import React from 'react';
import { Link } from 'react-router-dom';
import { usePageTransition } from '../hooks/usePageTransition';
import logo from '../assets/Logo_Anunza.png';
import './Navbar.css';

export function Navbar({ user, onLogout, noLeidas = 0, onToggleNotificaciones }) {
  const go = usePageTransition();
  return (
    <header className="anunza-navbar">
      <div className="anunza-navbar-inner">
        <Link to="/dashboard" className="anunza-navbar-brand">
          <img src={logo} alt="ANUNZA" className="anunza-navbar-logo" />
        </Link>
        <div className="anunza-navbar-actions">
          {user?.rol === 'admin' && (
            <button type="button" className="anunza-admin-link" title="Panel de administración" onClick={() => go('/admin')}>
              Admin
            </button>
          )}
          {user?.rol === 'moderador' && (
            <button type="button" className="anunza-admin-link" title="Panel de moderación" onClick={() => go('/moderador')}>
              Moderación
            </button>
          )}
          {/* Campanita de notificaciones */}
          <button
            type="button"
            className="anunza-notif-btn"
            onClick={onToggleNotificaciones}
            aria-label={`Notificaciones${noLeidas > 0 ? ` (${noLeidas} nuevas)` : ''}`}
            title="Notificaciones"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="22"
              height="22"
              fill="none"
              stroke="#8a4eff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
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
  );
}
