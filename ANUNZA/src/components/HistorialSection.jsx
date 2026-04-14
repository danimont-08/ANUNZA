import React, { useEffect, useState } from 'react';
import { apiFetch } from '../services/api';
import './HistorialSection.css';

export function HistorialSection() {
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
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="hist-wrap">
        <p>Cargando tu historial…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="hist-wrap">
        <div className="hist-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="hist-wrap">
      <header className="hist-head">
        <h1>Mi historial</h1>
        <p className="hist-promedio">
          Promedio de calificación:{' '}
          <strong>
            {data.promedio_calificacion != null ? data.promedio_calificacion : '—'}
          </strong>
        </p>
      </header>

      <div className="hist-grid">
        <section className="hist-card">
          <h2>Trabajos</h2>
          <ul className="hist-list">
            {(data.trabajos || []).length === 0 && <li className="hist-empty">Sin registros</li>}
            {(data.trabajos || []).map((t) => (
              <li key={t.id}>
                <span className="hist-item-title">{t.publicacion_titulo || 'Trabajo'}</span>
                <span className="hist-meta">
                  {t.estado ? `Estado: ${t.estado}` : ''}
                  {t.created_at ? ` · ${new Date(t.created_at).toLocaleDateString('es-CO')}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="hist-card">
          <h2>Calificaciones recibidas</h2>
          <ul className="hist-list">
            {(data.calificaciones || []).length === 0 && <li className="hist-empty">Sin calificaciones</li>}
            {(data.calificaciones || []).map((c) => (
              <li key={c.id}>
                <strong>Puntuación: {c.puntuacion ?? c.puntos ?? '—'}</strong>
                {c.comentario && <p>{c.comentario}</p>}
              </li>
            ))}
          </ul>
        </section>

        <section className="hist-card">
          <h2>Mis publicaciones</h2>
          <ul className="hist-list">
            {(data.publicaciones || []).length === 0 && <li className="hist-empty">Sin publicaciones</li>}
            {(data.publicaciones || []).map((p) => (
              <li key={p.id}>
                <span className="hist-item-title">{p.titulo || 'Sin título'}</span>
                <span className="hist-meta">{p.descripcion?.slice(0, 80)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="hist-card">
          <h2>Mis interacciones</h2>
          <ul className="hist-list">
            {(data.interacciones || []).length === 0 && <li className="hist-empty">Sin interacciones</li>}
            {(data.interacciones || []).map((i) => (
              <li key={i.id}>
                {i.tipo} · publicación {i.publicacion_id}
              </li>
            ))}
          </ul>
        </section>

        <section className="hist-card hist-card-wide">
          <h2>Historial de actividad</h2>
          <ul className="hist-list">
            {(data.historial || []).length === 0 && <li className="hist-empty">Sin entradas</li>}
            {(data.historial || []).map((h) => (
              <li key={h.id}>
                <span className="hist-item-title">{h.tipo}</span>
                <p>{h.descripcion}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
