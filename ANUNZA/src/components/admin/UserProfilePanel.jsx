import React, { useEffect, useCallback, useState } from 'react';
import { fetchAdminUsuario, fetchAdminUserPublicaciones, patchUserEstado } from '../../models/adminModel';
import { DEFAULT_AVATAR } from '../../utils/constants';
import { formatDate } from '../../utils/format';
import './UserProfilePanel.css';

function PubCard({ pub }) {
  const estado = pub.estado || 'activo';
  return (
    <div className="upp-pub-card">
      {pub.imagen_preview && (
        <img src={pub.imagen_preview} alt="" className="upp-pub-img" />
      )}
      <div className="upp-pub-body">
        <div className="upp-pub-top">
          <span className={`admin-badge admin-badge--${estado}`}>{estado}</span>
          {pub.categoria_nombre && (
            <span className="admin-badge admin-badge--oculto">{pub.categoria_nombre}</span>
          )}
        </div>
        <p className="upp-pub-title">{pub.titulo}</p>
        {pub.precio != null && (
          <p className="upp-pub-price">${Number(pub.precio).toLocaleString('es-CO')}</p>
        )}
        <p className="upp-pub-meta">
          {pub.tipo === 'busco' ? 'Busco' : 'Ofrezco'}
          {' · '}
          {pub.likes ?? 0} ♥
          {' · '}
          {pub.comentarios_count ?? 0} 💬
        </p>
        <p className="upp-pub-date">{formatDate(pub.created_at)}</p>
      </div>
    </div>
  );
}

export function UserProfilePanel({ userId, onClose, canActOn = true }) {
  const [usuario, setUsuario] = useState(null);
  const [pubs, setPubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPubs, setLoadingPubs] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const loadUser = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchAdminUsuario(userId);
      setUsuario(data.user);
    } catch (e) {
      setError(e.message || 'No se pudo cargar el usuario');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const loadPubs = useCallback(async () => {
    setLoadingPubs(true);
    try {
      const data = await fetchAdminUserPublicaciones(userId);
      setPubs(data.publicaciones || []);
    } catch { /* silencioso */ }
    finally { setLoadingPubs(false); }
  }, [userId]);

  useEffect(() => {
    loadUser();
    loadPubs();
  }, [loadUser, loadPubs]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleEstado = async (nuevoEstado) => {
    const msg = nuevoEstado === 'suspendido' ? '¿Suspender esta cuenta?' : '¿Reactivar esta cuenta?';
    if (!window.confirm(msg)) return;
    setBusy(true);
    try {
      await patchUserEstado(userId, nuevoEstado);
      await loadUser();
    } catch (e) {
      setError(e.message || 'Error al actualizar usuario');
    } finally {
      setBusy(false);
    }
  };

  const estado = usuario?.estado || 'activo';

  return (
    <div className="upp-backdrop" role="presentation" onClick={onClose}>
      <div
        className="upp-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Perfil de usuario"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="upp-head">
          <span className="upp-head-title">Perfil de usuario</span>
          <button type="button" className="admin-review-close" onClick={onClose} aria-label="Cerrar">✕</button>
        </header>

        <div className="upp-body">
          {loading && <p className="admin-review-loading">Cargando…</p>}
          {error && <p className="admin-error">{error}</p>}

          {usuario && !loading && (
            <>
              {/* Cabecera del perfil */}
              <div className="upp-profile-head">
                <img
                  src={usuario.foto_perfil || DEFAULT_AVATAR}
                  alt=""
                  className="upp-avatar"
                />
                <div className="upp-profile-info">
                  <h2 className="upp-name">{usuario.nombre}</h2>
                  <p className="upp-sub">{usuario.correo}</p>
                  {usuario.ciudad && <p className="upp-sub">{usuario.ciudad}</p>}
                </div>
                <span className={`admin-badge admin-badge--${estado}`}>{estado}</span>
              </div>

              {/* Chips de info */}
              <div className="upp-chips">
                {usuario.rol && <span className="admin-review-chip">{usuario.rol}</span>}
                {usuario.verificado && <span className="admin-review-chip admin-review-chip--price">Verificado</span>}
                {usuario.cedula && <span className="admin-review-chip">CC {usuario.cedula}</span>}
                {usuario.telefono && <span className="admin-review-chip">{usuario.telefono}</span>}
              </div>

              {usuario.descripcion && (
                <p className="upp-description">{usuario.descripcion}</p>
              )}

              <p className="upp-joined">Miembro desde {formatDate(usuario.created_at)}</p>

              {/* Acciones de moderación */}
              {canActOn && usuario.rol !== 'admin' && (
                <div className="upp-actions">
                  {estado !== 'suspendido' ? (
                    <button
                      type="button"
                      className="admin-btn admin-btn--secondary admin-review-btn-danger"
                      disabled={busy}
                      onClick={() => handleEstado('suspendido')}
                    >
                      Suspender cuenta
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="admin-btn admin-btn--primary"
                      disabled={busy}
                      onClick={() => handleEstado('activo')}
                    >
                      Reactivar cuenta
                    </button>
                  )}
                </div>
              )}

              {/* Publicaciones */}
              <div className="upp-pubs-section">
                <h3 className="upp-pubs-title">
                  Publicaciones
                  {!loadingPubs && <span className="upp-pubs-count">{pubs.length}</span>}
                </h3>
                {loadingPubs ? (
                  <p className="admin-review-loading">Cargando publicaciones…</p>
                ) : pubs.length === 0 ? (
                  <p className="admin-empty" style={{ padding: '1rem 0' }}>Este usuario no tiene publicaciones.</p>
                ) : (
                  <div className="upp-pubs-grid">
                    {pubs.map(p => <PubCard key={p.id} pub={p} />)}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
