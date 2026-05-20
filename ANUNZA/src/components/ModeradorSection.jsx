import React, { useCallback, useEffect, useState } from 'react';
import {
  fetchReportes,
  resolverReporte,
  ocultarPublicacion,
  mostrarPublicacion,
  fetchPublicacionesOcultas,
  fetchUsuarios,
  suspenderUsuario,
  levantarSuspension,
} from '../models/moderadorModel';
import './ModeradorSection.css';

const MOTIVO_LABEL = {
  spam: 'Spam',
  inapropiado: 'Contenido inapropiado',
  fraude: 'Fraude / Estafa',
  acoso: 'Acoso / Intimidación',
  otro: 'Otro',
};

const ESTADO_BADGE = {
  pendiente:  { label: 'Pendiente',  cls: 'badge-pendiente' },
  revisado:   { label: 'Revisado',   cls: 'badge-resuelto' },
  rechazado:  { label: 'Rechazado',  cls: 'badge-descartado' },
};

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso.endsWith('Z') ? iso : iso + 'Z').toLocaleDateString('es-CO', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch { return iso; }
}

function isSuspendido(estado) {
  return estado === 'suspendido';
}

/* ─── Subcomponente: Chat de conversación reportada ─────────── */
/* ─── Tab: Reportes ────────────────────────────────────────── */
function TabReportes() {
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [diasMap, setDiasMap] = useState({});
  const [feedback, setFeedback] = useState({});

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const d = await fetchReportes();
      setReportes(d.reportes || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const showFeedback = (id, msg, ok = true) => {
    setFeedback((prev) => ({ ...prev, [id]: { msg, ok } }));
    setTimeout(() => setFeedback((prev) => { const n = { ...prev }; delete n[id]; return n; }), 3000);
  };

  const handleOcultar = async (r) => {
    try {
      const d = await ocultarPublicacion(r.publicacion_id);
      showFeedback(r.id, d.message);
      load();
    } catch (e) { showFeedback(r.id, e.message, false); }
  };

  const handleMostrar = async (r) => {
    try {
      const d = await mostrarPublicacion(r.publicacion_id);
      showFeedback(r.id, d.message);
      load();
    } catch (e) { showFeedback(r.id, e.message, false); }
  };

  const handleSuspender = async (r) => {
    const dias = parseInt(diasMap[r.id] || '', 10);
    if (!dias || dias < 1) return showFeedback(r.id, 'Ingresa días válidos.', false);
    try {
      const d = await suspenderUsuario(r.dueno_id, dias);
      showFeedback(r.id, d.message);
      load();
    } catch (e) { showFeedback(r.id, e.message, false); }
  };

  const handleLevantarSuspension = async (r) => {
    try {
      const d = await levantarSuspension(r.dueno_id);
      showFeedback(r.id, d.message);
      load();
    } catch (e) { showFeedback(r.id, e.message, false); }
  };

  const handleResolver = async (r, accion) => {
    try {
      await resolverReporte(r.id, accion);
      showFeedback(r.id, accion === 'revisado' ? 'Reporte marcado como revisado.' : 'Reporte rechazado.');
      load();
    } catch (e) { showFeedback(r.id, e.message, false); }
  };

  if (loading) return <p className="mod-loading">Cargando reportes…</p>;
  if (error) return <p className="mod-error">{error}</p>;
  if (reportes.length === 0) return <p className="mod-empty">No hay reportes registrados.</p>;

  return (
    <>
      <div className="mod-card-list">
        {reportes.map((r) => {
          const est = ESTADO_BADGE[r.estado] || ESTADO_BADGE.pendiente;
          const suspendido = isSuspendido(r.dueno_estado);
          return (
            <div key={r.id} className={`mod-card ${r.estado !== 'pendiente' ? 'mod-card-dim' : ''}`}>
              <div className="mod-card-top">
                <span className={`mod-badge ${est.cls}`}>{est.label}</span>
                <span className="mod-badge mod-badge-motivo">
                  {MOTIVO_LABEL[r.motivo] || r.motivo}
                </span>
                <time className="mod-date">{formatDate(r.created_at)}</time>
              </div>

              {r.publicacion_titulo && (
                <p className="mod-pub-title">
                  <strong>Publicación:</strong> {r.publicacion_titulo}
                  {r.publicacion_estado === 'oculta' && (
                    <span className="mod-badge mod-badge-oculta"> oculta</span>
                  )}
                </p>
              )}


              {r.descripcion && (
                <p className="mod-desc">"{r.descripcion}"</p>
              )}

              <p className="mod-meta">
                Reportado por: <strong>{r.reportado_por || '—'}</strong>
                {r.dueno_nombre && (
                  <> · Autor: <strong>{r.dueno_nombre}</strong></>
                )}
              </p>

              {feedback[r.id] && (
                <p className={`mod-feedback ${feedback[r.id].ok ? 'mod-feedback-ok' : 'mod-feedback-err'}`}>
                  {feedback[r.id].msg}
                </p>
              )}

              {r.estado === 'pendiente' && (
                <div className="mod-actions">
                  {/* Acciones sobre la publicación */}
                  {r.publicacion_id && (
                    r.publicacion_estado === 'oculta' ? (
                      <button type="button" className="mod-btn mod-btn-secondary" onClick={() => handleMostrar(r)}>
                        Restaurar publicación
                      </button>
                    ) : (
                      <button type="button" className="mod-btn mod-btn-danger" onClick={() => handleOcultar(r)}>
                        Ocultar publicación
                      </button>
                    )
                  )}

                  {/* Acciones sobre el usuario autor */}
                  {r.dueno_id && (
                    suspendido ? (
                      <button type="button" className="mod-btn mod-btn-secondary" onClick={() => handleLevantarSuspension(r)}>
                        Levantar suspensión
                      </button>
                    ) : (
                      <div className="mod-suspend-row">
                        <input
                          type="number"
                          min="1"
                          max="365"
                          placeholder="Días"
                          className="mod-input-dias"
                          value={diasMap[r.id] || ''}
                          onChange={(e) => setDiasMap((p) => ({ ...p, [r.id]: e.target.value }))}
                        />
                        <button type="button" className="mod-btn mod-btn-warn" onClick={() => handleSuspender(r)}>
                          Suspender usuario
                        </button>
                      </div>
                    )
                  )}

                  {/* Resolver o descartar reporte */}
                  <button type="button" className="mod-btn mod-btn-success" onClick={() => handleResolver(r, 'revisado')}>
                    Marcar revisado
                  </button>
                  <button type="button" className="mod-btn mod-btn-ghost" onClick={() => handleResolver(r, 'rechazado')}>
                    Rechazar
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ─── Tab: Usuarios ────────────────────────────────────────── */
function TabUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [diasMap, setDiasMap] = useState({});
  const [feedback, setFeedback] = useState({});
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const d = await fetchUsuarios();
      setUsuarios(d.usuarios || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const showFeedback = (id, msg, ok = true) => {
    setFeedback((prev) => ({ ...prev, [id]: { msg, ok } }));
    setTimeout(() => setFeedback((prev) => { const n = { ...prev }; delete n[id]; return n; }), 3000);
  };

  const handleSuspender = async (u) => {
    const dias = parseInt(diasMap[u.id] || '', 10);
    if (!dias || dias < 1) return showFeedback(u.id, 'Ingresa días válidos.', false);
    try {
      const d = await suspenderUsuario(u.id, dias);
      showFeedback(u.id, d.message);
      load();
    } catch (e) { showFeedback(u.id, e.message, false); }
  };

  const handleLevantar = async (u) => {
    try {
      const d = await levantarSuspension(u.id);
      showFeedback(u.id, d.message);
      load();
    } catch (e) { showFeedback(u.id, e.message, false); }
  };

  if (loading) return <p className="mod-loading">Cargando usuarios…</p>;
  if (error) return <p className="mod-error">{error}</p>;

  const filtered = usuarios.filter((u) =>
    !search || u.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    u.correo?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <input
        type="search"
        className="mod-search"
        placeholder="Buscar por nombre o correo…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="mod-card-list">
        {filtered.map((u) => {
          const suspendido = isSuspendido(u.estado);
          return (
            <div key={u.id} className="mod-card mod-card-user">
              <div className="mod-user-head">
                <img
                  src={u.foto_perfil || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23b0aac8'%3E%3Ccircle cx='12' cy='8' r='4'/%3E%3Cpath d='M4 20c0-4 3.6-7 8-7s8 3 8 7'/%3E%3C/svg%3E"}
                  alt=""
                  className="mod-user-avatar"
                />
                <div>
                  <p className="mod-user-name">{u.nombre}</p>
                  <p className="mod-user-email">{u.correo}</p>
                  {u.ciudad && <p className="mod-user-city">{u.ciudad}</p>}
                </div>
                <div className="mod-user-badges">
                  {u.rol === 'moderador' && <span className="mod-badge mod-badge-mod">Moderador</span>}
                  {suspendido && (
                    <span className="mod-badge mod-badge-suspendido">Suspendido</span>
                  )}
                  {u.total_publicaciones != null && (
                    <span className="mod-badge mod-badge-count">{u.total_publicaciones} publicaciones</span>
                  )}
                  {u.total_reportes != null && u.total_reportes > 0 && (
                    <span className="mod-badge mod-badge-warn-count">{u.total_reportes} reportes</span>
                  )}
                </div>
              </div>

              {feedback[u.id] && (
                <p className={`mod-feedback ${feedback[u.id].ok ? 'mod-feedback-ok' : 'mod-feedback-err'}`}>
                  {feedback[u.id].msg}
                </p>
              )}

              {u.rol !== 'moderador' && (
                <div className="mod-actions">
                  {suspendido ? (
                    <button type="button" className="mod-btn mod-btn-secondary" onClick={() => handleLevantar(u)}>
                      Levantar suspensión
                    </button>
                  ) : (
                    <div className="mod-suspend-row">
                      <input
                        type="number"
                        min="1"
                        max="365"
                        placeholder="Días"
                        className="mod-input-dias"
                        value={diasMap[u.id] || ''}
                        onChange={(e) => setDiasMap((p) => ({ ...p, [u.id]: e.target.value }))}
                      />
                      <button type="button" className="mod-btn mod-btn-warn" onClick={() => handleSuspender(u)}>
                        Suspender
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && <p className="mod-empty">Sin resultados.</p>}
      </div>
    </div>
  );
}

/* ─── Tab: Publicaciones ocultas ────────────────────────────── */
function TabPublicacionesOcultas() {
  const [pubs, setPubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState({});

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const d = await fetchPublicacionesOcultas();
      setPubs(d.publicaciones || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const showFeedback = (id, msg, ok = true) => {
    setFeedback((prev) => ({ ...prev, [id]: { msg, ok } }));
    setTimeout(() => setFeedback((prev) => { const n = { ...prev }; delete n[id]; return n; }), 3000);
  };

  const handleRestaurar = async (id) => {
    try {
      const d = await mostrarPublicacion(id);
      showFeedback(id, d.message);
      load();
    } catch (e) { showFeedback(id, e.message, false); }
  };

  if (loading) return <p className="mod-loading">Cargando…</p>;
  if (error) return <p className="mod-error">{error}</p>;
  if (pubs.length === 0) return <p className="mod-empty">No hay publicaciones ocultas.</p>;

  return (
    <div className="mod-card-list">
      {pubs.map((p) => (
        <div key={p.id} className="mod-card">
          <p className="mod-pub-title"><strong>{p.titulo}</strong></p>
          <p className="mod-meta">Autor: <strong>{p.autor_nombre}</strong> · {formatDate(p.created_at)}</p>
          {feedback[p.id] && (
            <p className={`mod-feedback ${feedback[p.id].ok ? 'mod-feedback-ok' : 'mod-feedback-err'}`}>
              {feedback[p.id].msg}
            </p>
          )}
          <div className="mod-actions">
            <button type="button" className="mod-btn mod-btn-secondary" onClick={() => handleRestaurar(p.id)}>
              Restaurar publicación
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Componente principal ──────────────────────────────────── */
const TABS = [
  { key: 'reportes',   label: 'Reportes' },
  { key: 'usuarios',   label: 'Usuarios' },
  { key: 'ocultas',    label: 'Publicaciones ocultas' },
];

export function ModeradorSection() {
  const [tab, setTab] = useState('reportes');

  return (
    <div className="mod-section">
      <div className="mod-header">
        <h2 className="mod-title">Panel de Moderación</h2>
      </div>

      <div className="mod-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`mod-tab ${tab === t.key ? 'mod-tab-active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mod-body">
        {tab === 'reportes' && <TabReportes />}
        {tab === 'usuarios' && <TabUsuarios />}
        {tab === 'ocultas'  && <TabPublicacionesOcultas />}
      </div>
    </div>
  );
}
