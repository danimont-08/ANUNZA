import React, { useCallback, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  fetchAdminReportes,
  patchReporteEstado,
  marcarReporteRevisado,
  fetchAdminPublicacion,
  patchPublicacionEstado,
  fetchAdminUsuario,
  patchUserEstado,
} from '../../models/adminModel';
import { PublicationReviewModal } from '../../components/admin/PublicationReviewModal';
import { UserReviewModal } from '../../components/admin/UserReviewModal';

const MOTIVO_LABEL = {
  spam: 'Spam',
  inapropiado: 'Inapropiado',
  fraude: 'Fraude',
  acoso: 'Acoso',
  otro: 'Otro',
};

function Badge({ estado }) {
  const raw = (estado || 'pendiente').toLowerCase();
  const badgeKey = raw === 'desestimado' ? 'rechazado' : raw;
  const label = {
    pendiente: 'Pendiente',
    revisado: 'Revisado',
    rechazado: 'Rechazado',
  }[badgeKey] || estado || 'pendiente';
  return <span className={`admin-badge admin-badge--${badgeKey}`}>{label}</span>;
}

function truncate(str, max = 60) {
  if (!str) return null;
  const s = String(str).trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…`;
}

export function AdminReports() {
  const ctx = useOutletContext();
  const pc = ctx?.panelConfig ?? {};
  const apiFetchReportes    = pc.fetchReportes     ?? fetchAdminReportes;
  const apiDescartarReporte = pc.descartarReporte  ?? patchReporteEstado;
  const apiMarcarRevisado   = pc.marcarRevisado    ?? marcarReporteRevisado;
  const apiFetchPublicacion = pc.fetchPublicacion  ?? fetchAdminPublicacion;
  const apiPatchPublicacion = pc.patchPublicacion  ?? patchPublicacionEstado;
  const apiFetchUsuario     = pc.fetchUsuario      ?? fetchAdminUsuario;
  const apiPatchUsuario     = pc.patchUsuario      ?? patchUserEstado;
  const puedeEliminar       = pc.puedeEliminar     ?? true;

  const [reportes, setReportes] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [reviewReporte, setReviewReporte] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetchReportes();
      setReportes(data.reportes || []);
    } catch (e) {
      setError(e.message || 'Error al cargar reportes');
    } finally {
      setLoading(false);
    }
  }, [apiFetchReportes]);

  useEffect(() => {
    load();
  }, [load]);

  const openReview = async (r) => {
    setReviewReporte(r);
    if (r.estado !== 'revisado') {
      try {
        await apiMarcarRevisado(r.id);
        setReportes((prev) =>
          prev.map((rep) => rep.id === r.id ? { ...rep, estado: 'revisado' } : rep)
        );
      } catch { /* no bloquear la apertura del modal si falla */ }
    }
  };

  const handleDescartarReporte = async (id, { closeModal } = {}) => {
    setBusyId(`r-${id}`);
    try {
      await apiDescartarReporte(id);
      if (closeModal) setReviewReporte(null);
      await load();
    } catch (e) {
      setError(e.message || 'Error al descartar reporte');
    } finally {
      setBusyId(null);
    }
  };

  const handlePublicacion = async (publicacionId, estado) => {
    const confirmMsg =
      estado === 'eliminado'
        ? '¿Eliminar permanentemente esta publicación? Esta acción no se puede deshacer.'
        : estado === 'oculto'
          ? '¿Ocultar esta publicación?'
          : estado === 'activo'
            ? '¿Restaurar esta publicación?'
            : `¿Aplicar "${estado}" a esta publicación?`;
    if (!window.confirm(confirmMsg)) return;

    setBusyId(`p-${publicacionId}`);
    try {
      await apiPatchPublicacion(publicacionId, estado);
      if (estado === 'eliminado') {
        setReviewReporte(null);
      } else {
        setReviewReporte((prev) =>
          prev && prev.objeto_id === publicacionId
            ? { ...prev, publicacion_estado: estado }
            : prev
        );
      }
      await load();
    } catch (e) {
      setError(e.message || 'Error al moderar publicación');
    } finally {
      setBusyId(null);
    }
  };

  const handleUsuario = async (usuarioId, estado) => {
    const confirmMsg =
      estado === 'suspendido'
        ? '¿Suspender este usuario?'
        : '¿Restaurar este usuario?';
    if (!window.confirm(confirmMsg)) return;

    setBusyId(`u-${usuarioId}`);
    try {
      await apiPatchUsuario(usuarioId, estado);
      setReviewReporte((prev) =>
        prev ? { ...prev, usuario_estado: estado } : prev
      );
      await load();
    } catch (e) {
      setError(e.message || 'Error al moderar usuario');
    } finally {
      setBusyId(null);
    }
  };

  const modalBusy = !!busyId;

  return (
    <>
      <h1 className="admin-section-title">Publicaciones reportadas</h1>
      {error && <p className="admin-error">{error}</p>}

      <div className="admin-toolbar">
        <button type="button" className="admin-btn admin-btn--primary" onClick={load}>
          Actualizar
        </button>
      </div>

      <div className="admin-table-wrap">
        {loading ? (
          <p className="admin-empty">Cargando…</p>
        ) : reportes.length === 0 ? (
          <p className="admin-empty">No hay reportes en este filtro.</p>
        ) : (
          <table className="admin-table admin-table--reportes">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Publicación / Usuario</th>
                <th>Motivo</th>
                <th>Detalles</th>
                <th>Reportó</th>
                <th>Estado</th>
                <th>Estado pub.</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {reportes.map((r) => {
                const detalles = r.detalles?.trim();
                const titulo =
                  r.tipo === 'publicacion'
                    ? r.publicacion_titulo || 'Sin título'
                    : r.usuario_reportado_nombre || r.autor_nombre || '—';
                return (
                  <tr key={r.id}>
                    <td><Badge estado={r.tipo} /></td>
                    <td className="admin-cell-pub">
                      <button
                        type="button"
                        className="admin-link-btn"
                        onClick={() => openReview(r)}
                        title="Ver detalle"
                      >
                        {titulo}
                      </button>
                    </td>
                    <td>{MOTIVO_LABEL[r.motivo] || r.motivo}</td>
                    <td className="admin-cell-desc">
                      {detalles ? (
                        <span title={detalles}>{truncate(detalles, 48)}</span>
                      ) : (
                        <span className="admin-desc-empty">—</span>
                      )}
                    </td>
                    <td>{r.reportante_nombre}</td>
                    <td>
                      {r.estado === 'revisado' ? (
                        <span className="admin-badge admin-badge--revisado">Revisado</span>
                      ) : (
                        <span className="admin-badge admin-badge--pendiente">Pendiente</span>
                      )}
                    </td>
                    <td>
                      {r.tipo === 'publicacion' ? (
                        <Badge estado={r.publicacion_estado} />
                      ) : (
                        <span className="admin-desc-empty">—</span>
                      )}
                    </td>
                    <td>
                      {r.created_at
                        ? new Date(r.created_at).toLocaleString('es-CO', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })
                        : '—'}
                    </td>
                    <td>
                      <div className="admin-actions">
                        <button
                          type="button"
                          className="admin-btn-review"
                          disabled={busyId === `r-${r.id}`}
                          onClick={() => openReview(r)}
                        >
                          Revisar
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-btn--danger"
                          disabled={busyId === `r-${r.id}`}
                          onClick={() => handleDescartarReporte(r.id)}
                        >
                          Descartar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {reviewReporte?.tipo === 'publicacion' && (
        <PublicationReviewModal
          reporte={reviewReporte}
          busy={modalBusy}
          puedeEliminar={puedeEliminar}
          onClose={() => setReviewReporte(null)}
          onPatchReporte={(id) => handleDescartarReporte(id, { closeModal: true })}
          onPatchPublicacion={handlePublicacion}
          fetchPublicacion={apiFetchPublicacion}
        />
      )}

      {reviewReporte?.tipo === 'usuario' && (
        <UserReviewModal
          reporte={reviewReporte}
          busy={modalBusy}
          onClose={() => setReviewReporte(null)}
          onPatchReporte={(id) => handleDescartarReporte(id, { closeModal: true })}
          onPatchUsuario={handleUsuario}
          fetchUsuario={apiFetchUsuario}
        />
      )}
    </>
  );
}
