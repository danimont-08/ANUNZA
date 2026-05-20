import React from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Admin.css';

export function AdminLayout({
  basePath = '/admin',
  brand = 'ANUNZA · Administración',
  panelConfig = {},
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="admin-root">
      <header className="admin-header">
        <div className="admin-header-inner">
          <Link to={basePath} className="admin-brand">
            {brand}
          </Link>
          <div className="admin-header-actions">
            <Link to="/dashboard">Ir al feed</Link>
            <span className="admin-header-user" title={user?.nombre}>
              {user?.nombre}
            </span>
            <button type="button" className="admin-btn-logout" onClick={handleLogout}>
              Salir
            </button>
          </div>
        </div>
      </header>

      <div className="admin-body">
        <nav className="admin-nav">
          <NavLink to={basePath} end>
            Resumen
          </NavLink>
          <NavLink to={`${basePath}/usuarios`}>Usuarios</NavLink>
          <NavLink to={`${basePath}/reportes`}>Reportes</NavLink>
        </nav>
        <main className="admin-main">
          <Outlet context={{ panelConfig }} />
        </main>
      </div>
    </div>
  );
}
