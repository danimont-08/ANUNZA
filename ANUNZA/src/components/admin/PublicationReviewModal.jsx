import React, { useEffect, useState } from 'react';
import { MediaCarousel } from '../feed/MediaCarousel';
import { fetchAdminPublicacion as defaultFetchPublicacion } from '../../models/adminModel';
import './PublicationReviewModal.css';

const MOTIVO_LABEL = {
  spam: 'Spam o publicidad engañosa',
  inapropiado: 'Contenido inapropiado',
  fraude: 'Fraude o estafa',
  acoso: 'Acoso o intimidación',
  otro: 'Otro motivo',
};

const DEFAULT_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23b0aac8'%3E%3Ccircle cx='12' cy='8' r='4'/%3E%3Cpath d='M4 20c0-4 3.6-7 8-7s8 3 8 7'/%3E%3C/svg%3E";

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return '—';
  }
}

export function PublicationReviewModal({
  reporte,
  onClose,
  onPatchReporte,
  onPatchPublicacion,
  busy,
  puedeEliminar = true,
  fetchPublicacion = defaultFetchPublicacion,
}) {
  const [publicacion, setPublicacion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const pubId = reporte?.tipo === 'publicacion' ? reporte?.objeto_id : null;
    if (!pubId) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchPublicacion(pubId);
        if (!cancelled) setPublicacion(data.publicacion);
      } catch (e) {
        if (!cancelled) setError(e.message || 'No se pudo cargar la publicación');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reporte?.objeto_id, reporte?.tipo]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!reporte) return null;

  const texto = publicacion?.texto_plano ?? publicacion?.descripcion ?? '';
  const media = publicacion?.media_items?.length ? publicacion.media_items : [];
  const tags = publicacion?.hashtags || [];
  const svc = publicacion?.service_detalle;
  const reporteDesc = reporte.detalles?.trim();
  const pubEstado = reporte.publicacion_estado || publicacion?.estado || 'activo';

  return (
    <div className="admin-review-backdrop" role="presentation" onClick={onClose}>
      <div
        className="admin-review-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-review-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="admin-review-head">
          <h2 id="admin-review-title">Revisar publicación</h2>
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

          {loading && <p className="admin-review-loading">Cargando publicación…</p>}
          {error && <p className="admin-error">{error}</p>}

          {publicacion && !loading && (
            <section className="admin-review-pub">
              <div className="admin-review-pub-head">
                <img
                  src={publicacion.autor_foto || DEFAULT_AVATAR}
                  alt=""
                  className="admin-review-avatar"
                />
                <div>
                  <p className="admin-review-autor">{publicacion.autor_nombre}</p>
                  <p className="admin-review-meta">
                    {publicacion.autor_ciudad && `${publicacion.autor_ciudad} · `}
                    {formatDate(publicacion.created_at)}
                  </p>
                </div>
                <span className={`admin-badge admin-badge--${pubEstado || 'activo'}`}>
                  {pubEstado || 'activo'}
                </span>
              </div>

              <h3 className="admin-review-pub-title">{publicacion.titulo}</h3>

              <div className="admin-review-tags-row">
                {publicacion.tipo && (
                  <span className="admin-review-chip">
                    {publicacion.tipo === 'busco' ? 'Busco' : 'Ofrezco'}
                  </span>
                )}
                {publicacion.categoria_nombre && (
                  <span className="admin-review-chip">{publicacion.categoria_nombre}</span>
                )}
                {publicacion.precio != null && (
                  <span className="admin-review-chip admin-review-chip--price">
                    ${Number(publicacion.precio).toLocaleString('es-CO')}
                  </span>
                )}
              </div>

              {media.length > 0 && (
                <div className="admin-review-media">
                  <MediaCarousel items={media} />
                </div>
              )}

              {texto && <p className="admin-review-text">{texto}</p>}

              {tags.length > 0 && (
                <p className="admin-review-hashtags">
                  {tags.map((t) => (
                    <span key={t}>#{String(t).replace(/^#/, '')}</span>
                  ))}
                </p>
              )}

              {svc && (svc.materiales || svc.tiempo_estimado || svc.detalles) && (
                <div className="admin-review-service">
                  <p className="admin-review-service-title">Detalle del servicio</p>
                  {svc.materiales && (
                    <p>
                      <strong>Materiales:</strong> {svc.materiales}
                    </p>
                  )}
                  {svc.tiempo_estimado && (
                    <p>
                      <strong>Tiempo:</strong> {svc.tiempo_estimado}
                    </p>
                  )}
                  {svc.detalles && (
                    <p>
                      <strong>Detalles:</strong> {svc.detalles}
                    </p>
                  )}
                </div>
              )}
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
            {publicacion && onPatchPublicacion && (
              <>
                {pubEstado !== 'oculto' && (
                  <button
                    type="button"
                    className="admin-btn admin-btn--secondary"
                    disabled={busy}
                    onClick={() => onPatchPublicacion(publicacion.id, 'oculto')}
                  >
                    Ocultar publicación
                  </button>
                )}
                {puedeEliminar && pubEstado !== 'eliminado' && (
                  <button
                    type="button"
                    className="admin-btn admin-btn--secondary admin-review-btn-danger"
                    disabled={busy}
                    onClick={() => onPatchPublicacion(publicacion.id, 'eliminado')}
                  >
                    Eliminar permanentemente
                  </button>
                )}
                {pubEstado !== 'activo' && (
                  <button
                    type="button"
                    className="admin-btn admin-btn--primary"
                    disabled={busy}
                    onClick={() => onPatchPublicacion(publicacion.id, 'activo')}
                  >
                    Restaurar
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