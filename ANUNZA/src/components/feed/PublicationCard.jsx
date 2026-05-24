import React, { useState, useEffect, useRef } from 'react';
import { MediaCarousel } from './MediaCarousel';
import { ResenaPanel } from './ResenaPanel';
import { ReportModal } from './ReportModal';
import { DestacarModal } from './DestacarModal';
import {
  fetchComentarios,
  addComentarioApi,
  enviarReporte,
  deleteComentarioApi,
  toggleLikeComentarioApi,
} from '../../models/publicacionModel';
import './PublicationCard.css';
import './DestacarModal.css';

const DEFAULT_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23b0aac8'%3E%3Ccircle cx='12' cy='8' r='4'/%3E%3Cpath d='M4 20c0-4 3.6-7 8-7s8 3 8 7'/%3E%3C/svg%3E";

function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
  } catch { return ''; }
}

function isDestacadaActiva(p) {
  if (!p.destacada) return false;
  if (!p.destacada_hasta) return true;
  return new Date(p.destacada_hasta.endsWith('Z') ? p.destacada_hasta : p.destacada_hasta + 'Z') > new Date();
}

function parseResena(contenido) {
  const m = String(contenido).match(/^\[Reseña\s+(\d+)\/5\]\s*(.*)/s);
  if (!m) return null;
  return { rating: parseInt(m[1], 10), text: m[2].trim() };
}

function StarRating({ value, max = 5 }) {
  return (
    <span className="pub-star-rating" aria-label={`${value} de ${max} estrellas`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < value ? 'star-on' : 'star-off'}>★</span>
      ))}
    </span>
  );
}

/* ── SVG icons ── */
const IconDots     = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>);
const IconHeart    = ({ filled }) => (<svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>);
const IconComment  = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>);
const IconChat     = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>);
const IconBookmark = ({ filled }) => (<svg width="15" height="15" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>);
const IconFlag     = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>);
const IconTrash    = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>);
const IconShare    = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>);
const IconStar     = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>);

export function PublicationCard({
  p, currentUserId, onToggleLike, onToggleFavorito, onDeletePublicacion,
  onOpenChat, onError, onDestacar,
}) {
  const isOwn = p.usuario_id === currentUserId;
  const esMio = isOwn;
  const destacadaActiva = isDestacadaActiva(p);

  const [openMenu, setOpenMenu]             = useState(false);
  const [openComments, setOpenComments]     = useState(false);
  const [openResenas, setOpenResenas]       = useState(false);
  const [openResena, setOpenResena]         = useState(false);
  const [openReport, setOpenReport]         = useState(false);
  const [openReportUser, setOpenReportUser] = useState(false);
  const [openDestacar, setOpenDestacar]     = useState(false);
  const [comments, setComments]             = useState([]);
  const [commentCount, setCommentCount]     = useState(p.comentarios_count ?? 0);
  const [resenasCount, setResenasCount]     = useState(p.resenas_count ?? 0);
  const [promedioResenas, setPromedioResenas] = useState(p.promedio_resenas ?? null);
  const [draft, setDraft]                   = useState('');
  const [resenaDraft, setResenaDraft]       = useState('');
  const [rating, setRating]                 = useState(5);
  const [reportMotivo, setReportMotivo]         = useState('Contenido inapropiado');
  const [reportDetalles, setReportDetalles]     = useState('');
  const [reportMotivoUser, setReportMotivoUser]     = useState('Contenido inapropiado');
  const [reportDetallesUser, setReportDetallesUser] = useState('');
  const [menuComId, setMenuComId]           = useState(null);
  const [reportingComId, setReportingComId] = useState(null);
  const [reportComMotivo, setReportComMotivo] = useState('Contenido inapropiado');

  const menuRef    = useRef(null);
  const menuComRef = useRef(null);

  const media = p.media_items?.length ? p.media_items : [];
  const texto = p.texto_plano ?? p.descripcion ?? '';
  const tags  = p.hashtags || [];
  const svc   = p.service_detalle;

  const resenas = comments.filter((c) => parseResena(c.contenido));
  const avgResena = resenas.length
    ? Math.round((resenas.reduce((s, c) => s + parseResena(c.contenido).rating, 0) / resenas.length) * 10) / 10
    : null;

  const resenasLabel =
    resenasCount > 0 && promedioResenas != null
      ? `Reseñas · ${promedioResenas}★ (${resenasCount})`
      : `Reseñas · ${resenasCount}`;

  /* cerrar menú publicación al clic fuera */
  useEffect(() => {
    if (!openMenu) return;
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenu(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [openMenu]);

  /* cerrar menú comentario al clic fuera */
  useEffect(() => {
    if (!menuComId) return;
    const h = (e) => { if (menuComRef.current && !menuComRef.current.contains(e.target)) setMenuComId(null); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [menuComId]);

  const loadComments = async () => {
    try {
      const data = await fetchComentarios(p.id);
      setComments(data.comentarios || []);
      setCommentCount(data.comentarios?.length ?? commentCount);
    } catch (e) { onError(e.message); }
  };

  const toggleComments = () => {
    const next = !openComments;
    setOpenComments(next);
    if (next) {
      setOpenResenas(false);
      loadComments();
    }
  };

  const toggleResenas = () => {
    const next = !openResenas;
    setOpenResenas(next);
    if (next) setOpenComments(false);
  };

  const sendComment = async () => {
    const text = draft.trim();
    if (!text) return;
    try {
      const data = await addComentarioApi(p.id, text);
      setDraft('');
      setComments((c) => [...c, data.comentario]);
      setCommentCount((n) => n + 1);
    } catch (e) { onError(e.message); }
  };

  const sendResena = async () => {
    const text = resenaDraft.trim();
    if (!text) return;
    try {
      const data = await addComentarioApi(p.id, `[Reseña ${rating}/5] ${text}`);
      setResenaDraft('');
      setOpenResena(false);
      setOpenComments(true);
      setComments((c) => [...c, data.comentario]);
    } catch (e) { onError(e.message); }
  };

  const shareLink = async () => {
    const url = `${window.location.origin}/dashboard?post=${p.id}`;
    try { await navigator.clipboard.writeText(url); }
    catch { onError('No se pudo copiar el enlace'); }
  };

  const sendReporte = async () => {
    if (!reportMotivo) return;
    try {
      await enviarReporte({ tipo: 'publicacion', objeto_id: p.id, motivo: reportMotivo, detalles: reportDetalles });
      setOpenReport(false); setReportDetalles('');
    } catch (e) { onError(e.message); }
  };

  const sendReporteUsuario = async () => {
    if (!reportMotivoUser || !p.usuario_id) return;
    try {
      await enviarReporte({ tipo: 'usuario', objeto_id: p.usuario_id, motivo: reportMotivoUser, detalles: reportDetallesUser });
      setOpenReportUser(false); setReportDetallesUser('');
    } catch (e) { onError(e.message); }
  };

  const openFromMenu = (action) => {
    setOpenMenu(false);
    if (action === 'guardar')          { onToggleFavorito?.(p.id); }
    if (action === 'comentar')         { toggleComments(); }
    if (action === 'resena')           { setOpenResena((v) => !v); }
    if (action === 'compartir')        { shareLink(); }
    if (action === 'reportar')         { setOpenReport((v) => !v); }
    if (action === 'reportar-usuario') { setOpenReportUser((v) => !v); }
    if (action === 'destacar')         { setOpenDestacar(true); }
    if (action === 'eliminar') {
      if (window.confirm('¿Eliminar esta publicación? Esta acción no se puede deshacer.')) {
        onDeletePublicacion?.(p.id);
      }
    }
  };

  const handleLikeComentario = async (com) => {
    try {
      const data = await toggleLikeComentarioApi(com.id);
      setComments((prev) =>
        prev.map((c) => c.id === com.id ? { ...c, user_liked: data.liked, likes_count: data.likes_count } : c)
      );
    } catch (e) { onError(e.message); }
  };

  const handleDeleteComentario = async (comId) => {
    if (!window.confirm('¿Eliminar este comentario?')) return;
    try {
      await deleteComentarioApi(comId);
      setComments((prev) => prev.filter((c) => c.id !== comId));
      setCommentCount((n) => n - 1);
    } catch (e) { onError(e.message); }
  };

  const sendReportComentario = async (comId) => {
    try {
      await enviarReporte({ tipo: 'comentario', objeto_id: comId, motivo: reportComMotivo, detalles: '' });
      setReportingComId(null);
    } catch (e) { onError(e.message); }
  };

  return (
    <article className={`pub-card ${destacadaActiva ? 'pub-card-featured' : ''}`}>
      {destacadaActiva && <div className="pub-badge-destacado">⭐ Destacado</div>}

      {/* ── CABECERA ── */}
      <header className="pub-card-head">
        <img className="pub-avatar" src={p.autor_foto || DEFAULT_AVATAR} alt="" />
        <div className="pub-head-text">
          <div className="pub-author">
            {p.autor_nombre}
            {p.autor_verificado && (
              <span className="pub-badge-verificado" title="Usuario verificado">✓ Verificado</span>
            )}
            {p.autor_plan === 'premium' && (
              <span className="pub-badge-premium" title="Usuario Premium">★ Premium</span>
            )}
          </div>
          <time className="pub-time">{formatDate(p.created_at)}</time>
          {p.autor_ciudad && <div className="pub-loc">{p.autor_ciudad}</div>}
        </div>

        {/* ── MENÚ 3 PUNTOS ── */}
        <div className="pub-menu-wrap" ref={menuRef}>
          <button type="button" className="pub-menu-btn" title="Más opciones" onClick={() => setOpenMenu((v) => !v)}>
            <IconDots />
          </button>
          {openMenu && (
            <div className="pub-dropdown">
              <button type="button" className={`pub-dropdown-item${p.user_saved ? ' is-saved' : ''}`} onClick={() => openFromMenu('guardar')}>
                <IconBookmark filled={p.user_saved} />{p.user_saved ? 'Guardado' : 'Guardar'}
              </button>
              <button type="button" className="pub-dropdown-item" onClick={() => openFromMenu('comentar')}>
                <IconComment />Comentar
              </button>
              {!isOwn && (
                <button type="button" className="pub-dropdown-item" onClick={() => openFromMenu('resena')}>
                  <IconStar />Reseñar
                </button>
              )}
              <button type="button" className="pub-dropdown-item" onClick={() => openFromMenu('compartir')}>
                <IconShare />Compartir
              </button>
              {isOwn ? (
                <>
                  {!destacadaActiva && (
                    <button type="button" className="pub-dropdown-item" onClick={() => openFromMenu('destacar')}>
                      <IconStar />⭐ Destacar
                    </button>
                  )}
                  <button type="button" className="pub-dropdown-item is-danger" onClick={() => openFromMenu('eliminar')}>
                    <IconTrash />Eliminar
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className="pub-dropdown-item" onClick={() => openFromMenu('reportar')}>
                    <IconFlag />Reportar publicación
                  </button>
                  <button type="button" className="pub-dropdown-item" onClick={() => openFromMenu('reportar-usuario')}>
                    <IconFlag />Reportar usuario
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* ── CONTENIDO ── */}
      {p.categoria_nombre && <div className="pub-cat">{p.categoria_nombre}</div>}
      {p.titulo && <h2 className="pub-title">{p.titulo}</h2>}
      <p className="pub-desc">{texto}</p>

      {tags.length > 0 && (
        <div className="pub-tags">
          {tags.map((t) => (<span key={t} className="pub-tag">#{t}</span>))}
        </div>
      )}

      {svc && (svc.materiales || svc.tiempo_estimado || svc.detalles) && (
        <div className="pub-service">
          {svc.materiales      && <p><strong>Materiales:</strong> {svc.materiales}</p>}
          {svc.tiempo_estimado && <p><strong>Tiempo estimado:</strong> {svc.tiempo_estimado}</p>}
          {svc.detalles        && <p><strong>Detalles:</strong> {svc.detalles}</p>}
        </div>
      )}

      {p.precio != null && Number(p.precio) > 0 && (
        <p className="pub-price">Desde <strong>{Number(p.precio).toLocaleString('es-CO')}</strong></p>
      )}

      <MediaCarousel items={media} />

      {/* ── BARRA DE ACCIONES ── */}
      <footer className="pub-footer-bar">
        <button type="button" className={`pub-footer-btn${p.user_liked ? ' is-liked' : ''}`} onClick={() => onToggleLike(p.id)} title="Me gusta">
          <IconHeart filled={p.user_liked} />
          <span>{p.interacciones_count ?? 0}</span>
        </button>
        <button type="button" className="pub-footer-btn" onClick={toggleComments} title="Comentar">
          <IconComment />
          <span>Comentar{commentCount > 0 && ` · ${commentCount}`}</span>
        </button>
        <button
          type="button"
          className={`pub-footer-btn${resenasCount > 0 ? ' has-rating' : ''}`}
          onClick={toggleResenas}
          title="Ver reseñas"
        >
          <IconStar />
          <span>{resenasLabel}</span>
        </button>
        {!isOwn && (
          <button type="button" className="pub-footer-btn" onClick={() => onOpenChat(p.usuario_id, p.id)} title="Abrir chat">
            <IconChat />
            <span>Chat</span>
          </button>
        )}
      </footer>

      {/* ── PANEL RESEÑAS (ResenaPanel) ── */}
      {openResenas && (
        <div className="pub-panel pub-panel-reveal pub-panel-resenas">
          <ResenaPanel
            publicacionId={p.id}
            resenasCountInicial={resenasCount}
            promedioInicial={promedioResenas}
            onResenasChange={({ count, promedio }) => {
              setResenasCount(count);
              setPromedioResenas(promedio);
            }}
            onError={onError}
          />
        </div>
      )}

      {/* ── PANEL RESEÑA INLINE (escribir) ── */}
      {openResena && (
        <div className="pub-panel pub-panel-reveal">
          <p className="pub-panel-title">Reseña del servicio</p>
          <div className="pub-stars">
            {[1,2,3,4,5].map((n) => (
              <button key={n} type="button" className={n <= rating ? 'is-on' : ''} onClick={() => setRating(n)}>★</button>
            ))}
          </div>
          <textarea rows={3} placeholder="Cuéntanos tu experiencia…" value={resenaDraft} onChange={(e) => setResenaDraft(e.target.value)} />
          <button type="button" className="pub-send" onClick={sendResena}>Publicar reseña</button>
        </div>
      )}

      {/* ── PANEL COMENTARIOS ── */}
      {openComments && (
        <div className="pub-panel pub-panel-reveal">
          {resenas.length > 0 && (
            <div className="pub-resena-summary">
              <StarRating value={Math.round(avgResena)} />
              <span className="pub-resena-avg">{avgResena}</span>
              <span className="pub-resena-count">· {resenas.length} {resenas.length === 1 ? 'reseña' : 'reseñas'}</span>
            </div>
          )}

          <ul className="pub-comment-list">
            {comments.map((c) => {
              const resena = parseResena(c.contenido);
              const isComOwn = String(c.usuario_id) === String(currentUserId);
              const isComMenuOpen = menuComId === c.id;
              const isReportingThis = reportingComId === c.id;
              return (
                <li key={c.id} className="pub-comment">
                  <img src={c.autor_foto || DEFAULT_AVATAR} alt="" className="pub-c-av" />
                  <div className="pub-comment-body">
                    <strong className="pub-comment-author">{c.autor_nombre}</strong>
                    {resena ? (
                      <>
                        <StarRating value={resena.rating} />
                        <p className="pub-comment-text">{resena.text}</p>
                      </>
                    ) : (
                      <p className="pub-comment-text">{c.contenido}</p>
                    )}
                    {c.likes_count > 0 && (
                      <span className="pub-com-likes">{c.likes_count} me gusta</span>
                    )}
                    {isReportingThis && (
                      <div className="pub-com-report-panel">
                        <select value={reportComMotivo} onChange={(e) => setReportComMotivo(e.target.value)}
                          style={{ width: '100%', marginBottom: '0.4rem', borderRadius: '8px', border: '1px solid #ddd', padding: '0.35rem 0.5rem', fontFamily: 'inherit', fontSize: '0.82rem' }}>
                          <option>Contenido inapropiado</option>
                          <option>Spam o publicidad</option>
                          <option>Información falsa</option>
                          <option>Acoso o amenazas</option>
                          <option>Otro</option>
                        </select>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button type="button" className="pub-send" style={{ fontSize: '0.78rem', padding: '0.3rem 0.75rem' }} onClick={() => sendReportComentario(c.id)}>Enviar</button>
                          <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.78rem', color: '#888' }} onClick={() => setReportingComId(null)}>Cancelar</button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="pub-com-menu-wrap" ref={isComMenuOpen ? menuComRef : null}>
                    <button type="button" className="pub-com-menu-btn" onClick={() => setMenuComId(isComMenuOpen ? null : c.id)}>
                      <IconDots />
                    </button>
                    {isComMenuOpen && (
                      <div className="pub-dropdown pub-com-dropdown">
                        <button type="button" className={`pub-dropdown-item${c.user_liked ? ' is-saved' : ''}`}
                          onClick={() => { setMenuComId(null); handleLikeComentario(c); }}>
                          <IconHeart filled={c.user_liked} />
                          {c.user_liked ? 'Quitar me gusta' : 'Me gusta'}
                        </button>
                        <button type="button" className="pub-dropdown-item"
                          onClick={() => { setMenuComId(null); setReportingComId(c.id); }}>
                          <IconFlag />Reportar
                        </button>
                        {isComOwn && (
                          <button type="button" className="pub-dropdown-item is-danger"
                            onClick={() => { setMenuComId(null); handleDeleteComentario(c.id); }}>
                            <IconTrash />Eliminar
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="pub-comment-form">
            <input type="text" placeholder="Escribe un comentario…" value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') sendComment(); }} />
            <button type="button" onClick={sendComment}>Enviar</button>
          </div>
        </div>
      )}

      {/* ── PANEL REPORTAR PUBLICACIÓN ── */}
      {openReport && (
        <div className="pub-panel pub-panel-reveal">
          <p className="pub-panel-title">Reportar publicación</p>
          <select value={reportMotivo} onChange={(e) => setReportMotivo(e.target.value)}
            style={{ width: '100%', marginBottom: '0.5rem', borderRadius: '8px', border: '1px solid #ddd', padding: '0.45rem 0.6rem', fontFamily: 'inherit' }}>
            <option>Contenido inapropiado</option>
            <option>Spam o publicidad</option>
            <option>Información falsa</option>
            <option>Acoso o amenazas</option>
            <option>Otro</option>
          </select>
          <textarea rows={2} placeholder="Detalles adicionales (opcional)…" value={reportDetalles} onChange={(e) => setReportDetalles(e.target.value)} />
          <button type="button" className="pub-send" onClick={sendReporte}>Enviar reporte</button>
        </div>
      )}

      {/* ── PANEL REPORTAR USUARIO ── */}
      {openReportUser && (
        <div className="pub-panel pub-panel-reveal">
          <p className="pub-panel-title">Reportar a {p.autor_nombre}</p>
          <select value={reportMotivoUser} onChange={(e) => setReportMotivoUser(e.target.value)}
            style={{ width: '100%', marginBottom: '0.5rem', borderRadius: '8px', border: '1px solid #ddd', padding: '0.45rem 0.6rem', fontFamily: 'inherit' }}>
            <option>Contenido inapropiado</option>
            <option>Spam o publicidad</option>
            <option>Información falsa</option>
            <option>Acoso o amenazas</option>
            <option>Otro</option>
          </select>
          <textarea rows={2} placeholder="Detalles adicionales (opcional)…" value={reportDetallesUser} onChange={(e) => setReportDetallesUser(e.target.value)} />
          <button type="button" className="pub-send" onClick={sendReporteUsuario}>Enviar reporte</button>
        </div>
      )}

      {/* ── MODAL DESTACAR ── */}
      {openDestacar && (
        <DestacarModal
          publicacion={p}
          onClose={() => setOpenDestacar(false)}
          onSuccess={(data) => {
            setOpenDestacar(false);
            onDestacar?.(p.id, data);
          }}
        />
      )}
    </article>
  );
}