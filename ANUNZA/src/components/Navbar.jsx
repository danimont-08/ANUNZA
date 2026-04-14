import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/Logo_Anunza.png';
import './Navbar.css';

export function Navbar({ user, onLogout, onOpenProfile }) {
  return (
    <header className="anunza-navbar">
      <div className="anunza-navbar-inner">
        <Link to="/dashboard" className="anunza-navbar-brand">
          <img src={logo} alt="ANUNZA" className="anunza-navbar-logo" />
        </Link>
        <div className="anunza-navbar-actions">
          <button type="button" className="anunza-navbar-user" onClick={onOpenProfile}>
            <img
              src={user?.foto_perfil || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'}
              alt=""
              className="anunza-navbar-avatar"
            />
            <span className="anunza-navbar-name">{user?.nombre || 'Usuario'}</span>
          </button>
          <button type="button" className="anunza-navbar-logout" onClick={onLogout}>
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}
