import React, { useEffect, useRef } from 'react';
import { marcarNotificacionLeida, marcarTodasLeidasApi } from '../models/notificacionModel';
import './NotificacionesPanel.css';

const TIPO_ICONO = {
  nuevo_mensaje: '💬',
  comentario: '🗨️',
  resena: '⭐',
  me_gusta: '❤️',
  reporte: '🚨',
};

function formatRelTime(iso) {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso.endsWith('Z') ? iso : iso + 'Z').getTime()) / 1000;
  if (diff < 60) return 'ahora';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return `hace ${Math.floor(diff / 86400)} d`;
}

export function NotificacionesPanel({ notificaciones, onClose, onRefresh, onNavigate }) {
  const panelRef = useRef(null);

  useEffect(() => {
    function handleOut(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    }
    document.addEventListener('mousedown', handleOut);
    return () => document.removeEventListener('mousedown', handleOut);
  }, [onClose]);

  const handleClick = async (n) => {
    if (!n.leida) {
      await marcarNotificacionLeida(n.id).catch(() => {});
      onRefresh();
    }
    // Navegar a la sección/contenido correspondiente
    if (onNavigate) onNavigate(n);
  };

  const handleMarcarTodas = async () => {
    await marcarTodasLeidasApi().catch(() => {});
    onRefresh();
  };

  return (
    <div className="notif-panel" ref={panelRef} role="dialog" aria-label="Notificaciones">
      <div className="notif-panel-head">
        <span className="notif-panel-title">Notificaciones</span>
        <button type="button" className="notif-mark-all" onClick={handleMarcarTodas}>
          Marcar todas
        </button>
      </div>
      <ul className="notif-list">
        {notificaciones.length === 0 && (
          <li className="notif-empty">No tienes notificaciones nuevas</li>
        )}
        {notificaciones.map((n) => (
          <li
            key={n.id}
            className={`notif-item ${n.leida ? 'is-read' : 'is-unread'}`}
            onClick={() => handleClick(n)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleClick(n)}
          >
            <span className="notif-icon">{TIPO_ICONO[n.tipo] || '🔔'}</span>
            <div className="notif-body">
              <p className="notif-msg">{n.mensaje}</p>
              <time className="notif-time">{formatRelTime(n.created_at)}</time>
            </div>
            {!n.leida && <span className="notif-dot" />}
          </li>
        ))}
      </ul>
    </div>
  );
}
