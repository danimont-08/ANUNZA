import React, { useEffect, useState } from 'react';
import { fetchAdminUsuario as defaultFetchUsuario } from '../../models/adminModel';
import { DEFAULT_AVATAR } from '../../utils/constants';
import { formatDate } from '../../utils/format';
import './PublicationReviewModal.css';

const MOTIVO_LABEL = {
  spam: 'Spam o publicidad engañosa',
  inapropiado: 'Contenido inapropiado',
  fraude: 'Fraude o estafa',
  acoso: 'Acoso o intimidación',
  otro: 'Otro motivo',
};

export function UserReviewModal({
  reporte,
  onClose,
  onPatchReporte,
  onPatchUsuario,
  busy,
  fetchUsuario = defaultFetchUsuario,
}) {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const userId = reporte?.tipo === 'usuario' ? reporte?.objeto_id : null;
    if (!userId) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchUsuario(userId);
        if (!cancelled) setUsuario(data.user);
      } catch (e) {
        if (!cancelled) setError(e.message || 'No se pudo cargar el usuario');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [reporte?.objeto_id, reporte?.tipo]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!reporte) return null;

  const reporteDesc = reporte.detalles?.trim();
  const userEstado = usuario?.estado || 'activo';

  return (
    <div className="admin-review-backdrop" role="presentation" onClick={onClose}>
      <div
        className="admin-review-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-user-review-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="admin-review-head">
          <h2 id="admin-user-review-title">Revisar usuario reportado</h2>
          <button type="button" className="admin-review-close" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </header>

        <div className="admin-review-body">
          <section className="admin-review-report-box">
            <h3>Datos del reporte</h3>
            <dl className="admin-review-dl">
              <div>
                <dt>Reportó</dt>
                <dd>{reporte.reportante_nombre || '—'}</dd>
              </div>
              <div>
                <dt>Motivo</dt>
                <dd>{MOTIVO_LABEL[reporte.motivo] || reporte.motivo}</dd>
              </div>
              <div>
                <dt>Fecha del reporte</dt>
                <dd>{formatDate(reporte.created_at)}</dd>
              </div>
            </dl>
            {reporteDesc ? (
              <div className="admin-review-report-desc">
                <p className="admin-review-report-desc-label">Comentario del usuario</p>
                <p className="admin-review-report-desc-text">{reporteDesc}</p>
              </div>
            ) : (
              <p className="admin-review-no-desc">El usuario no añadió comentario al reporte.</p>
            )}
          </section>

          {loading && <p className="admin-review-loading">Cargando usuario…</p>}
          {error && <p className="admin-error">{error}</p>}

          {usuario && !loading && (
            <section className="admin-review-pub">
              <div className="admin-review-pub-head">
                <img
                  src={usuario.foto_perfil || DEFAULT_AVATAR}
                  alt=""
                  className="admin-review-avatar"
                />
                <div>
                  <p className="admin-review-autor">{usuario.nombre}</p>
                  <p className="admin-review-meta">
                    {usuario.correo}
                    {usuario.ciudad ? ` · ${usuario.ciudad}` : ''}
                  </p>
                </div>
                <span className={`admin-badge admin-badge--${userEstado}`}>
                  {userEstado}
                </span>
              </div>

              <div className="admin-review-tags-row">
                {usuario.rol && (
                  <span className="admin-review-chip">{usuario.rol}</span>
                )}
                {usuario.telefono && (
                  <span className="admin-review-chip">{usuario.telefono}</span>
                )}
                {usuario.cedula && (
                  <span className="admin-review-chip">CC {usuario.cedula}</span>
                )}
                {usuario.verificado && (
                  <span className="admin-review-chip admin-review-chip--price">Verificado</span>
                )}
              </div>

              {usuario.descripcion && (
                <p className="admin-review-text">{usuario.descripcion}</p>
              )}

              <div className="admin-review-service">
                <p className="admin-review-service-title">Información de cuenta</p>
                <p><strong>Registrado:</strong> {formatDate(usuario.created_at)}</p>
              </div>
            </section>
          )}
        </div>

        <footer className="admin-review-foot">
          <div className="admin-review-foot-actions">
            {onPatchReporte && (
              <button
                type="button"
                className="admin-btn admin-btn--secondary"
                disabled={busy}
                onClick={() => onPatchReporte(reporte.id)}
              >
                Rechazar reporte
              </button>
            )}
            {usuario && onPatchUsuario && (
              <>
                {userEstado !== 'suspendido' && (
                  <button
                    type="button"
                    className="admin-btn admin-btn--secondary admin-review-btn-danger"
                    disabled={busy}
                    onClick={() => onPatchUsuario(usuario.id, 'suspendido')}
                  >
                    Suspender usuario
                  </button>
                )}
                {userEstado === 'suspendido' && (
                  <button
                    type="button"
                    className="admin-btn admin-btn--primary"
                    disabled={busy}
                    onClick={() => onPatchUsuario(usuario.id, 'activo')}
                  >
                    Restaurar usuario
                  </button>
                )}
              </>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
