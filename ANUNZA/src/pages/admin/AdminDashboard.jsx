import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchAdminStats } from '../../models/adminModel';

const STAT_ITEMS = [
  { key: 'usuarios_total', label: 'Usuarios totales' },
  { key: 'usuarios_activos', label: 'Usuarios activos' },
  { key: 'usuarios_suspendidos', label: 'Suspendidos' },
  { key: 'publicaciones_total', label: 'Publicaciones' },
  { key: 'publicaciones_activas', label: 'Publicaciones activas' },
  { key: 'publicaciones_reportadas', label: 'Publicaciones reportadas' },
  { key: 'reportes_pendientes', label: 'Reportes pendientes' },
];

export function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const displayName = user?.nombre?.trim().split(/\s+/)[0] || 'administrador';

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchAdminStats();
        setStats(data.stats);
      } catch (e) {
        setError(e.message || 'Error al cargar estadísticas');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p className="admin-loading-inline">Cargando estadísticas…</p>;
  if (error) return <p className="admin-error">{error}</p>;

  return (
    <>
      <h1 className="admin-page-title">
        Hola, <span>{displayName}</span>
      </h1>
      <p className="admin-page-subtitle">Aquí tienes el estado actual de la plataforma</p>

      <div className="admin-stats">
        {STAT_ITEMS.map(({ key, label }) => (
          <div key={key} className="admin-stat-card">
            <div className="label">{label}</div>
            <div className="value">{stats?.[key] ?? 0}</div>
          </div>
        ))}
      </div>
    </>
  );
}
