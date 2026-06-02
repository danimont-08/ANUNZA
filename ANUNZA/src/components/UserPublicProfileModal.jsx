import React, { useEffect, useCallback, useState } from 'react';
import ReactDOM from 'react-dom';
import { apiFetch } from '../services/api';
import { DEFAULT_AVATAR } from '../utils/constants';
import { formatDate, formatCOP } from '../utils/format';
import { IconHeart, IconChat, IconMapPin, IconShieldCheck } from './icons';
import '../pages/UserPublicProfile.css';
import './UserPublicProfileModal.css';

function PubCard({ pub, onClick }) {
  return (
    <article
      className="upp2-pub-card upp2-pub-card--clickable"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      {pub.imagen_preview
        ? <img src={pub.imagen_preview} alt="" className="upp2-pub-img" />
        : <div className="upp2-pub-img upp2-pub-img--empty" />}
      <div className="upp2-pub-body">
        <div className="upp2-pub-chips">
          <span className={`upp2-chip ${pub.tipo === 'busco' ? 'upp2-chip--busco' : 'upp2-chip--ofrezco'}`}>
            {pub.tipo === 'busco' ? 'Busco' : 'Ofrezco'}
          </span>
          {pub.categoria_nombre && (
            <span className="upp2-chip upp2-chip--cat">{pub.categoria_nombre}</span>
          )}
        </div>
        <p className="upp2-pub-title">{pub.titulo}</p>
        {pub.precio != null && (
          <p className="upp2-pub-price">{formatCOP(pub.precio)}</p>
        )}
        <div className="upp2-pub-stats">
          <span><IconHeart size={14}/> {pub.likes ?? 0}</span>
          <span><IconChat size={14}/> {pub.comentarios_count ?? 0}</span>
        </div>
        <p className="upp2-pub-date">{formatDate(pub.created_at)}</p>
      </div>
    </article>
  );
}

export function UserPublicProfileModal({ userId, onClose, onNavigateToPost }) {
  const overlayRef = React.useRef(null);
  const [perfil, setPerfil] = useState(null);
  const [pubs, setPubs]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError('');
    try {
      const [pd, pubd] = await Promise.all([
        apiFetch(`/users/${userId}/public`),
        apiFetch(`/users/${userId}/publicaciones`),
      ]);
      setPerfil(pd.user);
      setPubs(pubd.publicaciones || []);
    } catch (e) {
      setError(e.message || 'No se pudo cargar el perfil');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (overlayRef.current) overlayRef.current.scrollTop = 0;
  }, [userId]);

  // Bloquea el scroll del body (necesario en iOS para que position:fixed no tenga scroll extra)
  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollY);
    };
  }, []);

  return ReactDOM.createPortal(
    <div className="uppm-overlay" role="dialog" aria-modal="true" ref={overlayRef}>
      <div className="uppm-topbar">
        <button type="button" className="uppm-back-btn" onClick={onClose}>
          ← Volver
        </button>
      </div>

      {loading && <p className="upp2-loading">Cargando perfil…</p>}
      {error   && <p className="uppm-error-inline">{error}</p>}

      {perfil && !loading && (
        <div className="upp2-main">
          <section className="upp2-hero">
            <div
              className="upp2-cover"
              style={perfil.foto_portada ? {
                backgroundImage: `url(${perfil.foto_portada})`,
                backgroundSize: 'cover',
                backgroundPosition: perfil.foto_portada_pos || '50% 50%',
              } : undefined}
            />
            <div className="upp2-hero-content">
              <img
                src={perfil.foto_perfil || DEFAULT_AVATAR}
                alt=""
                className="upp2-avatar"
              />
              <div className="upp2-identity">
                <h1 className="upp2-name">
                  {perfil.nombre}
                  {perfil.verificado && (
                    <span className="upp2-verified" title="Usuario verificado">
                      <IconShieldCheck size={14}/>
                    </span>
                  )}
                </h1>
                <div className="upp2-meta-row">
                  {perfil.ciudad && <span><IconMapPin size={14}/> {perfil.ciudad}</span>}
                  <span>Miembro desde {formatDate(perfil.created_at)}</span>
                </div>
                <div className="upp2-stats-row">
                  <div className="upp2-stat">
                    <span className="upp2-stat-num">{perfil.total_publicaciones ?? pubs.length}</span>
                    <span className="upp2-stat-label">publicaciones</span>
                  </div>
                  <div className="upp2-stat">
                    <span className="upp2-stat-num">{perfil.total_likes ?? 0}</span>
                    <span className="upp2-stat-label">me gusta recibidos</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {perfil.descripcion && (
            <section className="upp2-about">
              <p>{perfil.descripcion}</p>
            </section>
          )}

          <section className="upp2-pubs-section">
            <h2 className="upp2-pubs-title">
              Publicaciones
              <span className="upp2-pubs-count">{pubs.length}</span>
            </h2>
            {pubs.length === 0 ? (
              <p className="upp2-empty">Este usuario no tiene publicaciones activas.</p>
            ) : (
              <div className="upp2-pubs-grid">
                {pubs.map(pub => (
                <PubCard
                  key={pub.id}
                  pub={pub}
                  onClick={() => { onClose(); onNavigateToPost?.(pub.id); }}
                />
              ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>,
    document.body
  );
}
