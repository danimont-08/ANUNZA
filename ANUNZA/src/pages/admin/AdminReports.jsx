import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { formatDate } from '../../utils/format';
import { PublicationReviewModal } from '../../components/admin/PublicationReviewModal';
import { UserReviewModal } from '../../components/admin/UserReviewModal';
import { MensajeReviewModal } from '../../components/admin/MensajeReviewModal';
import { ConfirmDialog } from '../../components/ConfirmDialog';

const MOTIVO_LABEL = {
  spam: 'Spam',
  inapropiado: 'Inapropiado',
  fraude: 'Fraude',
  acoso: 'Acoso',
  otro: 'Otro',
};

const TABS = [
  { key: 'todos',      label: 'Todos' },
  { key: 'publicacion', label: 'Publicaciones' },
  { key: 'usuario',    label: 'Usuarios' },
  { key: 'mensaje',    label: 'Mensajes' },
];

function truncate(str, max = 55) {
  if (!str) return null;
  const s = String(str).trim();
  return s.length <= max ? s : `${s.slice(0, max)}…`;
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
  const [tab, setTab] = useState('todos');
  const [estadoFiltro, setEstadoFiltro] = useState('pendiente');
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async (estado = estadoFiltro) => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetchReportes(estado);
      setReportes(data.reportes || []);
    } catch (e) {
      setError(e.message || 'Error al cargar reportes');
    } finally {
      setLoading(false);
    }
  }, [apiFetchReportes, estadoFiltro]);

  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => ({
    todos: reportes.length,
    publicacion: reportes.filter(r => r.tipo === 'publicacion').length,
    usuario: reportes.filter(r => r.tipo === 'usuario').length,
    mensaje: reportes.filter(r => r.tipo === 'mensaje').length,
  }), [reportes]);

  const filtered = useMemo(
    () => tab === 'todos' ? reportes : reportes.filter(r => r.tipo === tab),
    [reportes, tab]
  );

  const openReview = async (r) => {
    setReviewReporte(r);
    if (r.estado !== 'revisado') {
      try {
        await apiMarcarRevisado(r.id);
        setReportes(prev => prev.map(rep => rep.id === r.id ? { ...rep, estado: 'revisado' } : rep));
      } catch { /* no bloquear apertura */ }
    }
  };

  const handleDescartarReporte = async (id, { closeModal } = {}) => {
    setBusyId(`r-${id}`);
    try {
      await apiDescartarReporte(id);
      if (closeModal) setReviewReporte(null);
      setReportes((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      setError(e.message || 'Error al descartar reporte');
    } finally {
      setBusyId(null);
    }
  };

  const handlePublicacion = (publicacionId, estado) => {
    const msg =
      estado === 'eliminado' ? '¿Eliminar permanentemente esta publicación? Esta acción no se puede deshacer.'
      : estado === 'oculto'  ? '¿Ocultar esta publicación?'
      : estado === 'activo'  ? '¿Restaurar esta publicación?'
      : `¿Aplicar "${estado}" a esta publicación?`;
    setConfirm({
      message: msg,
      danger: estado === 'eliminado',
      confirmLabel: estado === 'eliminado' ? 'Eliminar' : estado === 'oculto' ? 'Ocultar' : 'Restaurar',
      action: async () => {
        setBusyId(`p-${publicacionId}`);
        try {
          await apiPatchPublicacion(publicacionId, estado);
          if (estado === 'eliminado') {
            setReviewReporte(null);
            setReportes((prev) => prev.filter((r) => r.objeto_id !== publicacionId));
          } else {
            setReviewReporte((prev) =>
              prev?.objeto_id === publicacionId ? { ...prev, publicacion_estado: estado } : prev
            );
          }
        } catch (e) {
          setError(e.message || 'Error al moderar publicación');
        } finally {
          setBusyId(null);
        }
      },
    });
  };

  const handleUsuario = (usuarioId, estado) => {
    setConfirm({
      message: estado === 'suspendido' ? '¿Suspender este usuario?' : '¿Restaurar este usuario?',
      danger: estado === 'suspendido',
      confirmLabel: estado === 'suspendido' ? 'Suspender' : 'Restaurar',
      action: async () => {
        setBusyId(`u-${usuarioId}`);
        try {
          await apiPatchUsuario(usuarioId, estado);
          setReviewReporte(null);
          setReportes((prev) =>
            prev.map((r) =>
              r.usuario_id === usuarioId ? { ...r, usuario_estado: estado } : r
            )
          );
        } catch (e) {
          setError(e.message || 'Error al moderar usuario');
        } finally {
          setBusyId(null);
        }
      },
    });
  };

  const modalBusy = !!busyId;

  return (
    <>
      <h1 className="admin-section-title">Reportes</h1>
      {error && <p className="admin-error">{error}</p>}

      {/* Filtro pendientes / revisados */}
      <div className="admin-report-estado-bar">
        <button
          type="button"
          className={`admin-report-estado-btn${estadoFiltro === 'pendiente' ? ' is-active' : ''}`}
          onClick={() => setEstadoFiltro('pendiente')}
        >
          Pendientes
        </button>
        <button
          type="button"
          className={`admin-report-estado-btn${estadoFiltro === 'revisado' ? ' is-active' : ''}`}
          onClick={() => setEstadoFiltro('revisado')}
        >
          Revisados
        </button>
      </div>

      {/* Tabs de agrupación */}
      <div className="admin-report-tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            type="button"
            className={`admin-report-tab${tab === t.key ? ' active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            <span className="admin-report-tab-count">{counts[t.key]}</span>
          </button>
        ))}
        <button
          type="button"
          className="admin-btn admin-btn--secondary admin-report-refresh"
          onClick={load}
        >
          Actualizar
        </button>
      </div>

      <div className="admin-table-wrap">
        {loading ? (
          <p className="admin-empty">Cargando…</p>
        ) : filtered.length === 0 ? (
          <p className="admin-empty">No hay reportes en este grupo.</p>
        ) : (
          <table className="admin-table admin-table--reportes">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Publicación / Usuario / Mensaje</th>
                <th>Motivo</th>
                <th>Detalles</th>
                <th>Reportó</th>
                <th>Fecha</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const detalles = r.detalles?.trim();
                const titulo =
                  r.tipo === 'publicacion' ? (r.publicacion_titulo || 'Sin título')
                  : r.tipo === 'usuario'   ? (r.usuario_reportado_nombre || '—')
                  : r.tipo === 'mensaje'   ? (r.mensaje_remitente_nombre
                      ? `Mensaje de ${r.mensaje_remitente_nombre}`
                      : 'Mensaje')
                  : '—';
                return (
                  <tr key={r.id}>
                    <td>
                      <span className={`admin-badge admin-badge--${
                        r.tipo === 'publicacion' ? 'revisado'
                        : r.tipo === 'usuario' ? 'pendiente'
                        : 'oculto'
                      }`}>
                        {r.tipo === 'publicacion' ? 'Publicación'
                          : r.tipo === 'usuario' ? 'Usuario'
                          : 'Mensaje'}
                      </span>
                    </td>
                    <td className="admin-cell-pub">
                      <button
                        type="button"
                        className="admin-link-btn"
                        onClick={() => openReview(r)}
                        title="Revisar"
                      >
                        {titulo}
                      </button>
                    </td>
                    <td>{MOTIVO_LABEL[r.motivo] || r.motivo}</td>
                    <td className="admin-cell-desc">
                      {detalles
                        ? <span title={detalles}>{truncate(detalles)}</span>
                        : <span className="admin-desc-empty">—</span>}
                    </td>
                    <td>{r.reportante_nombre || '—'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDate(r.created_at)}</td>
                    <td>
                      <div className="admin-actions">
                        <button
                          type="button"
                          className="admin-btn-review"
                          disabled={!!busyId}
                          onClick={() => openReview(r)}
                        >
                          Revisar
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

      {reviewReporte?.tipo === 'mensaje' && (
        <MensajeReviewModal
          reporte={reviewReporte}
          busy={modalBusy}
          onClose={() => setReviewReporte(null)}
          onPatchReporte={(id) => handleDescartarReporte(id, { closeModal: true })}
          onPatchUsuario={handleUsuario}
        />
      )}

      {confirm && (
        <ConfirmDialog
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          danger={confirm.danger}
          onConfirm={() => { const fn = confirm.action; setConfirm(null); fn(); }}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}
