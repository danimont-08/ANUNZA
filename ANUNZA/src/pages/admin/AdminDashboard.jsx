import React, { useCallback, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  fetchAdminStats,
  fetchAdminUsers,
  fetchAdminPublicaciones,
  fetchAdminReportes,
} from '../../models/adminModel';
import { formatDate } from '../../utils/format';
import { IconX } from '../../components/icons';

const STAT_ITEMS = [
  { key: 'usuarios_total',          label: 'Usuarios totales',          panelType: 'usuarios_todos'       },
  { key: 'usuarios_activos',        label: 'Usuarios activos',          panelType: 'usuarios_activos'     },
  { key: 'usuarios_suspendidos',    label: 'Suspendidos',               panelType: 'usuarios_suspendidos' },
  { key: 'publicaciones_activas',   label: 'Publicaciones activas',     panelType: 'pubs_activas'         },
  { key: 'publicaciones_ocultas',   label: 'Publicaciones ocultas',     panelType: 'pubs_ocultas'         },
  { key: 'publicaciones_reportadas',label: 'Con reportes',              panelType: 'pubs_reportadas'      },
  { key: 'reportes_pendientes',     label: 'Reportes pendientes',       panelType: 'reportes'             },
];

function StatDetailPanel({ panelType, onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (panelType === 'usuarios_todos') {
        const d = await fetchAdminUsers({});
        setItems(d.users ?? []);
      } else if (panelType === 'usuarios_activos') {
        const d = await fetchAdminUsers({ estado: 'activo' });
        setItems(d.users ?? []);
      } else if (panelType === 'usuarios_suspendidos') {
        const d = await fetchAdminUsers({ estado: 'suspendido' });
        setItems(d.users ?? []);
      } else if (panelType === 'pubs_activas') {
        const d = await fetchAdminPublicaciones('activo');
        setItems(d.publicaciones ?? []);
      } else if (panelType === 'pubs_ocultas') {
        const d = await fetchAdminPublicaciones('oculto');
        setItems(d.publicaciones ?? []);
      } else if (panelType === 'pubs_reportadas' || panelType === 'reportes') {
        const d = await fetchAdminReportes();
        const all = d.reportes ?? [];
        setItems(panelType === 'pubs_reportadas'
          ? all.filter(r => r.tipo === 'publicacion')
          : all.filter(r => r.estado === 'pendiente')
        );
      }
    } catch (e) {
      setError(e.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [panelType]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const isUsers = panelType.startsWith('usuarios');
  const isPubs  = panelType.startsWith('pubs');

  const titles = {
    usuarios_todos:       'Todos los usuarios',
    usuarios_activos:     'Usuarios activos',
    usuarios_suspendidos: 'Usuarios suspendidos',
    pubs_activas:         'Publicaciones activas',
    pubs_ocultas:         'Publicaciones ocultas',
    pubs_reportadas:      'Publicaciones con reportes',
    reportes:             'Reportes pendientes',
  };

  return (
    <div className="sdp-backdrop" onClick={onClose}>
      <div className="sdp-panel" onClick={e => e.stopPropagation()}>
        <header className="sdp-head">
          <span className="sdp-title">{titles[panelType]}</span>
          <button type="button" className="admin-review-close" onClick={onClose} aria-label="Cerrar"><IconX size={16}/></button>
        </header>

        <div className="sdp-body">
          {loading && <p className="admin-review-loading">Cargando…</p>}
          {error   && <p className="admin-error">{error}</p>}
          {!loading && items.length === 0 && (
            <p className="admin-empty">No hay elementos en esta categoría.</p>
          )}
          {!loading && items.length > 0 && (
            <ul className="sdp-list">
              {isUsers && items.map(u => (
                <li key={u.id} className="sdp-item">
                  <div className="sdp-item-main">
                    <span className="sdp-item-name">{u.nombre}</span>
                    <span className="sdp-item-sub">{u.correo}</span>
                  </div>
                  <span className={`admin-badge admin-badge--${u.estado || 'activo'}`}>
                    {u.estado || 'activo'}
                  </span>
                </li>
              ))}
              {isPubs && items.map(p => (
                <li key={p.id} className="sdp-item">
                  <div className="sdp-item-main">
                    <span className="sdp-item-name">{p.titulo || 'Sin título'}</span>
                    <span className="sdp-item-sub">{p.autor_nombre} · {formatDate(p.created_at)}</span>
                  </div>
                  <span className={`admin-badge admin-badge--${p.estado}`}>{p.estado}</span>
                </li>
              ))}
              {!isUsers && !isPubs && items.map(r => (
                <li key={r.id} className="sdp-item">
                  <div className="sdp-item-main">
                    <span className="sdp-item-name">
                      {r.tipo === 'publicacion' ? (r.publicacion_titulo || 'Publicación')
                        : r.tipo === 'usuario' ? (r.usuario_reportado_nombre || 'Usuario')
                        : 'Mensaje'}
                    </span>
                    <span className="sdp-item-sub">
                      {r.motivo} · {r.reportante_nombre} · {formatDate(r.created_at)}
                    </span>
                  </div>
                  <span className={`admin-badge admin-badge--${r.estado}`}>{r.estado}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const { user } = useAuth();
  const ctx = useOutletContext();
  const apiFetchStats = ctx?.panelConfig?.fetchStats ?? fetchAdminStats;

  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [openPanel, setOpenPanel] = useState(null);

  const displayName = user?.nombre?.trim().split(/\s+/)[0] || 'administrador';

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetchStats();
        setStats(data.stats);
      } catch (e) {
        setError(e.message || 'Error al cargar estadísticas');
      } finally {
        setLoading(false);
      }
    })();
  }, [apiFetchStats]);

  if (loading) return <p className="admin-loading-inline">Cargando estadísticas…</p>;
  if (error) return <p className="admin-error">{error}</p>;

  return (
    <>
      <h1 className="admin-page-title">
        Hola, <span>{displayName}</span>
      </h1>
      <p className="admin-page-subtitle">Aquí tienes el estado actual de la plataforma</p>

      <div className="admin-stats">
        {STAT_ITEMS.map(({ key, label, panelType }) => (
          <button
            key={key}
            type="button"
            className="admin-stat-card admin-stat-card--clickable"
            onClick={() => setOpenPanel(panelType)}
          >
            <div className="label">{label}</div>
            <div className="value">{stats?.[key] ?? 0}</div>
            <div className="admin-stat-hint">Ver detalle →</div>
          </button>
        ))}
      </div>

      {openPanel && (
        <StatDetailPanel
          panelType={openPanel}
          onClose={() => setOpenPanel(null)}
        />
      )}
    </>
  );
}
