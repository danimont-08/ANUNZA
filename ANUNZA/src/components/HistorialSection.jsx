import React, { useEffect, useState } from 'react';
import { apiFetch } from '../services/api';
import { deletePublicacionApi } from '../models/publicacionModel';
import './HistorialSection.css';

/** Replica la lógica de parseDescripcion del backend para el frontend */
function parseDesc(raw) {
  if (!raw) return { text: '', hashtags: [] };
  const s = String(raw).trim();
  if (!s.startsWith('{')) return { text: s, hashtags: [] };
  try {
    const j = JSON.parse(s);
    return {
      text: j.text != null ? String(j.text) : '',
      hashtags: Array.isArray(j.hashtags) ? j.hashtags : [],
    };
  } catch {
    return { text: s, hashtags: [] };
  }
}

export function HistorialSection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const cargar = () => {
    let cancelled = false;
    setLoading(true);
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
  };

  useEffect(cargar, []);

  const handleEliminar = async (pubId) => {
    if (!window.confirm('¿Eliminar esta publicación? Esta acción no se puede deshacer.')) return;
    try {
      await deletePublicacionApi(pubId);
      setData((prev) => ({
        ...prev,
        publicaciones: prev.publicaciones.filter((p) => p.id !== pubId),
        favoritos: prev.favoritos?.filter((p) => p.id !== pubId) ?? [],
      }));
    } catch (e) {
      setError(e.message);
    }
  };

  if (loading) return <div className="hist-wrap"><p>Cargando tu historial…</p></div>;
  if (error) return <div className="hist-wrap"><div className="hist-error">{error}</div></div>;

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
        {/* MIS PUBLICACIONES */}
        <section className="hist-card hist-card-wide">
          <h2>Mis publicaciones</h2>
          <ul className="hist-list">
            {(data.publicaciones || []).length === 0 && <li className="hist-empty">Sin publicaciones</li>}
            {(data.publicaciones || []).map((p) => {
              const { text, hashtags } = parseDesc(p.descripcion);
              return (
                <li key={p.id} style={{ paddingBottom: '0.75rem' }}>
                  <span className="hist-item-title">{p.titulo || 'Sin título'}</span>
                  {text && <span className="hist-meta">{text.slice(0, 120)}{text.length > 120 ? '…' : ''}</span>}
                  {hashtags.length > 0 && (
                    <span className="hist-meta" style={{ color: 'var(--anunza-violet)', fontWeight: 600 }}>
                      {hashtags.map((t) => `#${t}`).join(' ')}
                    </span>
                  )}
                  {p.tipo && (
                    <span className="hist-meta">
                      {p.tipo === 'ofrezco' ? '📢 Ofrezco' : '🔍 Busco'}
                      {p.precio ? ` · $${Number(p.precio).toLocaleString('es-CO')}` : ''}
                      {p.created_at ? ` · ${new Date(p.created_at).toLocaleDateString('es-CO')}` : ''}
                    </span>
                  )}
                  <button
                    type="button"
                    className="pub-btn pub-delete"
                    style={{ marginTop: '0.35rem', fontSize: '0.78rem', padding: '0.25rem 0.65rem' }}
                    onClick={() => handleEliminar(p.id)}
                  >
                    Eliminar
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {/* MIS FAVORITOS */}
        <section className="hist-card hist-card-wide">
          <h2>⭐ Mis favoritos</h2>
          <ul className="hist-list">
            {(data.favoritos || []).length === 0 && <li className="hist-empty">No has guardado publicaciones aún</li>}
            {(data.favoritos || []).map((p) => {
              const { text, hashtags } = parseDesc(p.descripcion);
              return (
                <li key={p.id} style={{ paddingBottom: '0.75rem' }}>
                  <span className="hist-item-title">{p.titulo || 'Sin título'}</span>
                  {text && <span className="hist-meta">{text.slice(0, 120)}{text.length > 120 ? '…' : ''}</span>}
                  {hashtags.length > 0 && (
                    <span className="hist-meta" style={{ color: 'var(--anunza-violet)', fontWeight: 600 }}>
                      {hashtags.map((t) => `#${t}`).join(' ')}
                    </span>
                  )}
                  {p.tipo && (
                    <span className="hist-meta">
                      {p.tipo === 'ofrezco' ? '📢 Ofrezco' : '🔍 Busco'}
                      {p.precio ? ` · $${Number(p.precio).toLocaleString('es-CO')}` : ''}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        {/* TRABAJOS */}
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

        {/* CALIFICACIONES */}
        <section className="hist-card">
          <h2>Calificaciones recibidas</h2>
          {(() => {
            const cals = data.calificaciones || [];
            if (cals.length === 0) return <ul className="hist-list"><li className="hist-empty">Sin calificaciones</li></ul>;
            const avg = Math.round((cals.reduce((s, c) => s + (c.puntuacion ?? c.puntos ?? 0), 0) / cals.length) * 10) / 10;
            const rounded = Math.round(avg);
            return (
              <div style={{ textAlign: 'center', padding: '0.75rem 0.5rem' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--anunza-violet)', lineHeight: 1 }}>{avg}</div>
                <div style={{ fontSize: '1.3rem', margin: '0.25rem 0', letterSpacing: '2px' }}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <span key={i} style={{ color: i < rounded ? '#f5b301' : '#e0e0e0' }}>★</span>
                  ))}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#888' }}>
                  {cals.length} {cals.length === 1 ? 'calificación' : 'calificaciones'}
                </div>
              </div>
            );
          })()}
        </section>

        {/* HISTORIAL DE ACTIVIDAD */}
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
