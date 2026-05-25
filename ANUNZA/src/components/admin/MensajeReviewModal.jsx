import React from 'react';
import { formatDate } from '../../utils/format';
import './PublicationReviewModal.css';

const MOTIVO_LABEL = {
  spam: 'Spam o publicidad engañosa',
  inapropiado: 'Contenido inapropiado',
  fraude: 'Fraude o estafa',
  acoso: 'Acoso o intimidación',
  otro: 'Otro motivo',
};

export function MensajeReviewModal({
  reporte,
  onClose,
  onPatchReporte,
  onPatchUsuario,
  busy,
}) {
  if (!reporte) return null;

  const reporteDesc = reporte.detalles?.trim();
  const remitente = reporte.mensaje_remitente_nombre || '—';
  const contenido = reporte.mensaje_contenido || null;
  const remitenteId = reporte.mensaje_remitente_id;

  return (
    <div className="admin-review-backdrop" role="presentation">
      <div
        className="admin-review-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-msg-review-title"
      >
        <header className="admin-review-head">
          <h2 id="admin-msg-review-title">Revisar mensaje reportado</h2>
          <span className="admin-review-decision-badge">Se requiere una decisión</span>
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

          <section className="admin-review-pub">
            <div className="admin-review-pub-head">
              <div>
                <p className="admin-review-autor">{remitente}</p>
                <p className="admin-review-meta">Remitente del mensaje</p>
              </div>
            </div>

            {contenido ? (
              <div className="admin-review-service">
                <p className="admin-review-service-title">Contenido del mensaje</p>
                <p className="admin-review-report-desc-text">{contenido}</p>
              </div>
            ) : (
              <p className="admin-review-no-desc">El contenido del mensaje no está disponible.</p>
            )}
          </section>
        </div>

        <footer className="admin-review-foot">
          <p className="admin-review-foot-hint">Elige una acción para cerrar este reporte:</p>
          <div className="admin-review-foot-actions">
            {onPatchReporte && (
              <button
                type="button"
                className="admin-btn admin-btn--secondary"
                disabled={busy}
                onClick={() => onPatchReporte(reporte.id)}
              >
                Reporte inválido
              </button>
            )}
            {remitenteId && onPatchUsuario && (
              <button
                type="button"
                className="admin-btn admin-btn--secondary admin-review-btn-danger"
                disabled={busy}
                onClick={() => onPatchUsuario(remitenteId, 'suspendido')}
              >
                Suspender remitente
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
