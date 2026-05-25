import React, { useEffect, useCallback, useState } from 'react';
import { apiFetch } from '../services/api';
import { DEFAULT_AVATAR } from '../utils/constants';
import { formatDate } from '../utils/format';
import './UserPublicProfileModal.css';

function PubMiniCard({ pub }) {
  return (
    <div className="uppm-pub-card">
      {pub.imagen_preview
        ? <img src={pub.imagen_preview} alt="" className="uppm-pub-img" />
        : <div className="uppm-pub-img uppm-pub-img--empty" />}
      <div className="uppm-pub-info">
        <span className={`uppm-tipo ${pub.tipo === 'busco' ? 'uppm-tipo--busco' : 'uppm-tipo--ofrezco'}`}>
          {pub.tipo === 'busco' ? 'Busco' : 'Ofrezco'}
        </span>
        {pub.categoria_nombre && (
          <span className="uppm-cat">{pub.categoria_nombre}</span>
        )}
        <p className="uppm-pub-title">{pub.titulo}</p>
        {pub.precio != null && (
          <p className="uppm-pub-price">${Number(pub.precio).toLocaleString('es-CO')}</p>
        )}
        <p className="uppm-pub-stats">♥ {pub.likes ?? 0} · 💬 {pub.comentarios_count ?? 0}</p>
      </div>
    </div>
  );
}

export function UserPublicProfileModal({ userId, onClose }) {
  const [perfil, setPerfil] = useState(null);
  const [pubs, setPubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  return (
    <div className="uppm-backdrop" role="presentation" onClick={onClose}>
      <div
        className="uppm-panel"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="uppm-close" type="button" onClick={onClose} aria-label="Cerrar">✕</button>

        {loading && <p className="uppm-loading">Cargando perfil…</p>}
        {error && <p className="uppm-error">{error}</p>}

        {perfil && !loading && (
          <>
            <div className="prof-card uppm-prof-card">
              <div
                className="uppm-cover"
                style={perfil.foto_portada ? {
                  backgroundImage: `url(${perfil.foto_portada})`,
                  backgroundSize: 'cover',
                  backgroundPosition: perfil.foto_portada_pos || '50% 50%',
                } : undefined}
              />
              <div className="prof-head uppm-head-offset">
                <img
                  src={perfil.foto_perfil || DEFAULT_AVATAR}
                  alt=""
                  className="prof-avatar"
                />
                <div>
                  <p className="prof-name">
                    {perfil.nombre}
                    {perfil.verificado && (
                      <span className="prof-badge prof-badge-verificado" title="Verificado">✓ Verificado</span>
                    )}
                  </p>
                  {perfil.ciudad && <p className="prof-meta">📍 {perfil.ciudad}</p>}
                  <p className="prof-meta uppm-since">
                    Miembro desde {formatDate(perfil.created_at)}
                  </p>
                </div>
              </div>

              <div className="uppm-stats">
                <div className="uppm-stat">
                  <span className="uppm-stat-num">{perfil.total_publicaciones ?? pubs.length}</span>
                  <span className="uppm-stat-label">publicaciones</span>
                </div>
                <div className="uppm-stat">
                  <span className="uppm-stat-num">{perfil.total_likes ?? 0}</span>
                  <span className="uppm-stat-label">me gusta recibidos</span>
                </div>
              </div>

              {perfil.descripcion && (
                <p className="prof-bio">{perfil.descripcion}</p>
              )}
            </div>

            <div className="uppm-pubs">
              <h3 className="uppm-pubs-title">
                Publicaciones
                <span className="uppm-pubs-count">{pubs.length}</span>
              </h3>
              {pubs.length === 0 ? (
                <p className="uppm-empty">Sin publicaciones activas.</p>
              ) : (
                <div className="uppm-pubs-grid">
                  {pubs.map(p => <PubMiniCard key={p.id} pub={p} />)}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}