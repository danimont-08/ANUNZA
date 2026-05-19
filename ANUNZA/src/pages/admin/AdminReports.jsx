import React, { useCallback, useEffect, useState } from 'react';
import {
  fetchAdminReportes,
  patchReporteEstado,
  patchPublicacionEstado,
} from '../../models/adminModel';
import { PublicationReviewModal } from '../../components/admin/PublicationReviewModal';

const MOTIVO_LABEL = {
  spam: 'Spam',
  inapropiado: 'Inapropiado',
  fraude: 'Fraude',
  acoso: 'Acoso',
  otro: 'Otro',
};

const REPORTE_ESTADO_LABEL = {
  pendiente: 'Pendiente',
  revisado: 'Revisado',
  desestimado: 'Rechazado',
  rechazado: 'Rechazado',
};

function Badge({ estado }) {
  const raw = (estado || 'pendiente').toLowerCase();
  const badgeKey = raw === 'desestimado' ? 'rechazado' : raw;
  const label = REPORTE_ESTADO_LABEL[raw] || estado || 'pendiente';
  return <span className={`admin-badge admin-badge--${badgeKey}`}>{label}</span>;
}

function truncate(str, max = 60) {
  if (!str) return null;
  const s = String(str).trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…`;
}

export function AdminReports() {
  const [reportes, setReportes] = useState([]);
  const [estadoFilter, setEstadoFilter] = useState('pendiente');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [reviewReporte, setReviewReporte] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchAdminReportes({
        estado: estadoFilter || undefined,
      });
      setReportes(data.reportes || []);
    } catch (e) {
      setError(e.message || 'Error al cargar reportes');
    } finally {
      setLoading(false);
    }
  }, [estadoFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleReporte = async (id, estado, { closeModal } = {}) => {
    setBusyId(`r-${id}`);
    try {
      await patchReporteEstado(id, estado);
      await load();
      if (closeModal) {
        setReviewReporte((prev) =>
          prev && prev.id === id ? { ...prev, estado } : prev
        );
      }
    } catch (e) {
      setError(e.message || 'Error al actualizar reporte');
    } finally {
      setBusyId(null);
    }
  };

  const handlePublicacion = async (publicacionId, estado) => {
    const labels = { oculto: 'ocultar', eliminado: 'eliminar', activo: 'restaurar' };
    if (!window.confirm(`¿${labels[estado] || estado} esta publicación?`)) return;

    setBusyId(`p-${publicacionId}`);
    try {
      await patchPublicacionEstado(publicacionId, estado);
      await load();
      setReviewReporte((prev) =>
        prev && prev.publicacion_id === publicacionId
          ? { ...prev, publicacion_estado: estado }
          : prev
      );
    } catch (e) {
      setError(e.message || 'Error al moderar publicación');
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
        <select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)}>
          <option value="">Todos</option>
          <option value="pendiente">Pendientes</option>
          <option value="revisado">Revisados</option>
          <option value="desestimado">Rechazados</option>
        </select>
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
                <th>Publicación</th>
                <th>Comentario</th>
                <th>Autor</th>
                <th>Reportó</th>
                <th>Motivo</th>
                <th>Estado pub.</th>
                <th>Reporte</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {reportes.map((r) => {
                const desc = r.descripcion?.trim();
                return (
                  <tr key={r.id}>
                    <td className="admin-cell-pub">
                      <button
                        type="button"
                        className="admin-link-btn"
                        onClick={() => setReviewReporte(r)}
                        title="Ver publicación completa"
                      >
                        {r.publicacion_titulo || 'Sin título'}
                      </button>
                    </td>
                    <td className="admin-cell-desc">
                      {desc ? (
                        <button
                          type="button"
                          className="admin-desc-preview"
                          onClick={() => setReviewReporte(r)}
                          title={desc}
                        >
                          {truncate(desc, 48)}
                        </button>
                      ) : (
                        <span className="admin-desc-empty">—</span>
                      )}
                    </td>
                    <td>{r.autor_nombre}</td>
                    <td>{r.reportante_nombre}</td>
                    <td>{MOTIVO_LABEL[r.motivo] || r.motivo}</td>
                    <td>
                      <Badge estado={r.publicacion_estado} />
                    </td>
                    <td>
                      <Badge estado={r.estado} />
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
                          onClick={() => setReviewReporte(r)}
                        >
                          Revisar
                        </button>
                        {r.estado === 'pendiente' && (
                          <>
                            <button
                              type="button"
                              disabled={!!busyId}
                              onClick={() => handleReporte(r.id, 'revisado')}
                            >
                              Revisado
                            </button>
                            <button
                              type="button"
                              disabled={!!busyId}
                              onClick={() => handleReporte(r.id, 'desestimado')}
                            >
                              Rechazar
                            </button>
                          </>
                        )}
                        {r.publicacion_estado !== 'oculto' && (
                          <button
                            type="button"
                            className="danger"
                            disabled={busyId === `p-${r.publicacion_id}`}
                            onClick={() => handlePublicacion(r.publicacion_id, 'oculto')}
                          >
                            Ocultar
                          </button>
                        )}
                        {r.publicacion_estado !== 'eliminado' && (
                          <button
                            type="button"
                            className="danger"
                            disabled={busyId === `p-${r.publicacion_id}`}
                            onClick={() => handlePublicacion(r.publicacion_id, 'eliminado')}
                          >
                            Eliminar
                          </button>
                        )}
                        {r.publicacion_estado !== 'activo' && (
                          <button
                            type="button"
                            disabled={busyId === `p-${r.publicacion_id}`}
                            onClick={() => handlePublicacion(r.publicacion_id, 'activo')}
                          >
                            Restaurar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {reviewReporte && (
        <PublicationReviewModal
          reporte={reviewReporte}
          busy={modalBusy}
          onClose={() => setReviewReporte(null)}
          onPatchReporte={(id, estado) =>
            handleReporte(id, estado, { closeModal: true })
          }
          onPatchPublicacion={handlePublicacion}
        />
      )}
    </>
  );
}
