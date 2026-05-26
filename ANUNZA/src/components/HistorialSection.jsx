import React, { useEffect, useState } from 'react';
import { apiFetch } from '../services/api';
import { formatCOP } from '../utils/format';
import './HistorialSection.css';

/** Parsea la descripción que puede ser texto plano o JSON {"text":"..."}. */
function parseTitulo(raw) {
  if (!raw) return '';
  const s = String(raw).trim();
  if (s.startsWith('{')) {
    try { return JSON.parse(s).text?.slice(0, 80) || s.slice(0, 80); } catch { return s.slice(0, 80); }
  }
  return s.slice(0, 80);
}

const TIPO_ICONO = {
  me_gusta: '❤️',
  like: '❤️',
  me_interesa: '⭐',
};

export function HistorialSection({ onNavigateToPost }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch('/historial/mi');
        if (!cancelled) setData(res);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="hist-wrap"><p>Cargando tu historial…</p></div>;
  if (error)   return <div className="hist-wrap"><div className="hist-error">{error}</div></div>;

  return (
    <div className="hist-wrap">
      <header className="hist-head">
        <h1>Mi historial</h1>
        <p className="hist-promedio">
          Promedio de calificación:{' '}
          <strong>{data.promedio_calificacion != null ? data.promedio_calificacion : '—'}</strong>
        </p>
      </header>

      <div className="hist-grid">
        {/* Calificaciones */}
        <section className="hist-card">
          <h2>Calificaciones recibidas</h2>
          <ul className="hist-list">
            {(data.calificaciones || []).length === 0 && <li className="hist-empty">Sin calificaciones</li>}
            {(data.calificaciones || []).map((c) => (
              <li key={c.id}>
                <strong>{'★'.repeat(c.puntuacion ?? c.puntos ?? 0)} {c.puntuacion ?? c.puntos ?? '—'}/5</strong>
                {c.comentario && <p>{c.comentario}</p>}
                {c.imagen_url && (
                  <img src={c.imagen_url} alt="Imagen de reseña" className="hist-resena-img" />
                )}
                {c.video_url && (
                  <video src={c.video_url} controls playsInline className="hist-resena-video" />
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* Publicaciones guardadas */}
        <section className="hist-card">
          <h2>Guardados</h2>
          <ul className="hist-list">
            {(data.publicaciones_guardadas || []).length === 0 && (
              <li className="hist-empty">No has guardado publicaciones</li>
            )}
            {(data.publicaciones_guardadas || []).map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className="hist-item-link"
                  title={p.titulo || 'Ver publicación'}
                  onClick={() => onNavigateToPost?.(p.id)}
                >
                  {p.titulo || 'Sin título'}
                </button>
                {p.precio != null && Number(p.precio) > 0 && (
                  <span className="hist-meta">
                    Desde {formatCOP(p.precio)}
                  </span>
                )}
                {p.guardado_en && (
                  <span className="hist-meta">
                    Guardado el {new Date(p.guardado_en).toLocaleDateString('es-CO')}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* Interacciones */}
        <section className="hist-card">
          <h2>Mis interacciones</h2>
          <ul className="hist-list">
            {(data.interacciones || []).length === 0 && <li className="hist-empty">Sin interacciones</li>}
            {(data.interacciones || []).map((i) => (
              <li key={i.id}>
                <span className="hist-icon">{TIPO_ICONO[i.tipo] || '🔹'}</span>
                <button
                  type="button"
                  className="hist-item-link"
                  onClick={() => i.publicacion_id && onNavigateToPost?.(i.publicacion_id)}
                >
                  {i.tipo === 'me_gusta' || i.tipo === 'like'
                    ? `Le diste me gusta a "${i.publicacion_titulo || 'una publicación'}"`
                    : `${i.tipo} en "${i.publicacion_titulo || 'una publicación'}"`}
                </button>
                {i.created_at && (
                  <span className="hist-meta">
                    {new Date(i.created_at).toLocaleDateString('es-CO')}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>

      </div>
    </div>
  );
}
