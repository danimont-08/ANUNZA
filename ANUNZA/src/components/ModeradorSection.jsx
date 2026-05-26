import React, { useCallback, useEffect, useState } from 'react';
import {
  fetchReportes,
  ocultarPublicacion,
  mostrarPublicacion,
  marcarModReporteRevisado,
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

const TIPO_BADGE = {
  publicacion: { label: 'Publicación', cls: 'mod-badge-tipo-pub' },
  usuario:     { label: 'Usuario',     cls: 'mod-badge-tipo-usr' },
  mensaje:     { label: 'Mensaje',     cls: 'mod-badge-tipo-msg' },
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
  const [filtro, setFiltro] = useState('pendiente');
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [diasMap, setDiasMap] = useState({});
  const [feedback, setFeedback] = useState({});

  const load = useCallback(async (estado = filtro) => {
    setError('');
    setLoading(true);
    try {
      const d = await fetchReportes(estado);
      setReportes(d.reportes || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filtro]);

  useEffect(() => { load(); }, [load]);

  const cambiarFiltro = (nuevo) => {
    setFiltro(nuevo);
  };

  const showFeedback = (id, msg, ok = true) => {
    setFeedback((prev) => ({ ...prev, [id]: { msg, ok } }));
    setTimeout(() => setFeedback((prev) => { const n = { ...prev }; delete n[id]; return n; }), 3000);
  };

  const handleOcultar = async (r) => {
    try {
      const d = await ocultarPublicacion(r.publicacion_id);
      await marcarModReporteRevisado(r.id).catch(() => {});
      showFeedback(r.id, d.message);
      load();
    } catch (e) { showFeedback(r.id, e.message, false); }
  };

  const handleMostrar = async (r) => {
    try {
      const d = await mostrarPublicacion(r.publicacion_id);
      await marcarModReporteRevisado(r.id).catch(() => {});
      showFeedback(r.id, d.message);
      load();
    } catch (e) { showFeedback(r.id, e.message, false); }
  };

  const handleMarcarRevisado = async (r) => {
    try {
      await marcarModReporteRevisado(r.id);
      showFeedback(r.id, 'Reporte marcado como revisado.');
      load();
    } catch (e) { showFeedback(r.id, e.message, false); }
  };

  return (
    <>
      <div className="mod-filtro-bar">
        <button
          type="button"
          className={`mod-filtro-btn${filtro === 'pendiente' ? ' is-active' : ''}`}
          onClick={() => cambiarFiltro('pendiente')}
        >
          Pendientes
        </button>
        <button
          type="button"
          className={`mod-filtro-btn${filtro === 'revisado' ? ' is-active' : ''}`}
          onClick={() => cambiarFiltro('revisado')}
        >
          Revisados
        </button>
      </div>

      {loading && <p className="mod-loading">Cargando reportes…</p>}
      {error && <p className="mod-error">{error}</p>}
      {!loading && !error && reportes.length === 0 && (
        <p className="mod-empty">
          {filtro === 'pendiente' ? 'No hay reportes pendientes.' : 'No hay reportes revisados.'}
        </p>
      )}

      <div className="mod-card-list">
        {reportes.map((r) => {
          const tipoBadge = TIPO_BADGE[r.tipo] || { label: r.tipo, cls: '' };

          // Normalizar el "usuario afectado" según el tipo de reporte
          const targetId     = r.tipo === 'publicacion' ? r.dueno_id     : r.usuario_obj_id;
          const targetNombre = r.tipo === 'publicacion' ? r.dueno_nombre : r.usuario_obj_nombre;
          const targetEstado = r.tipo === 'publicacion' ? r.dueno_estado : r.usuario_obj_estado;
          const targetRol    = r.tipo === 'publicacion' ? r.dueno_rol    : r.usuario_obj_rol;
          const suspendido   = isSuspendido(targetEstado);

          const handleSuspenderTarget = async () => {
            const dias = parseInt(diasMap[r.id] || '', 10);
            if (!dias || dias < 1) return showFeedback(r.id, 'Ingresa días válidos.', false);
            try {
              const d = await suspenderUsuario(targetId, dias);
              showFeedback(r.id, d.message);
              load();
            } catch (e) { showFeedback(r.id, e.message, false); }
          };

          const handleLevantarTarget = async () => {
            try {
              const d = await levantarSuspension(targetId);
              showFeedback(r.id, d.message);
              load();
            } catch (e) { showFeedback(r.id, e.message, false); }
          };

          return (
            <div key={r.id} className="mod-card">
              <div className="mod-card-top">
                <span className={`mod-badge ${tipoBadge.cls}`}>{tipoBadge.label}</span>
                <span className="mod-badge mod-badge-motivo">
                  {MOTIVO_LABEL[r.motivo] || r.motivo}
                </span>
                <time className="mod-date">{formatDate(r.created_at)}</time>
              </div>

              {r.tipo === 'publicacion' && r.publicacion_titulo && (
                <p className="mod-pub-title">
                  <strong>Publicación:</strong> {r.publicacion_titulo}
                  {r.publicacion_estado === 'oculta' && (
                    <span className="mod-badge mod-badge-oculta"> oculta</span>
                  )}
                </p>
              )}

              {r.detalles && (
                <p className="mod-desc">"{r.detalles}"</p>
              )}

              <p className="mod-meta">
                Reportado por: <strong>{r.reportado_por || '—'}</strong>
                {targetNombre && (
                  <> · {r.tipo === 'publicacion' ? 'Autor' : 'Usuario reportado'}: <strong>{targetNombre}</strong></>
                )}
              </p>

              {feedback[r.id] && (
                <p className={`mod-feedback ${feedback[r.id].ok ? 'mod-feedback-ok' : 'mod-feedback-err'}`}>
                  {feedback[r.id].msg}
                </p>
              )}

              <div className="mod-actions">
                {/* Acciones sobre la publicación (solo si tipo='publicacion') */}
                {r.tipo === 'publicacion' && r.publicacion_id && (
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

                {/* Acciones sobre el usuario afectado */}
                {targetId && targetRol !== 'admin' && (
                  suspendido ? (
                    <button type="button" className="mod-btn mod-btn-secondary" onClick={handleLevantarTarget}>
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
                      <button type="button" className="mod-btn mod-btn-warn" onClick={handleSuspenderTarget}>
                        Suspender usuario
                      </button>
                    </div>
                  )
                )}

                {/* Marcar como revisado (solo en pestaña pendientes) */}
                {filtro === 'pendiente' && (
                  <button type="button" className="mod-btn mod-btn-ghost" onClick={() => handleMarcarRevisado(r)}>
                    Marcar como revisado
                  </button>
                )}
              </div>
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
                  {u.rol === 'admin' && <span className="mod-badge mod-badge-admin">Admin</span>}
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

              {u.rol !== 'moderador' && u.rol !== 'admin' && (
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
