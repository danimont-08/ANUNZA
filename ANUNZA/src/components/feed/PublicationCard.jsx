import React, { useState, useRef, useEffect } from 'react';
import { MediaCarousel } from './MediaCarousel';
import { UserPublicProfileModal } from '../UserPublicProfileModal';
import { ResenaPanel } from './ResenaPanel';
import {
  fetchComentarios,
  addComentarioApi,
  toggleGuardarPublicacion,
} from '../../models/publicacionModel';
import { ReportModal } from './ReportModal';
import { DestacarModal } from './DestacarModal';
import {
  IconHeart, IconChat, IconComment, IconStar,
  IconShare, IconBookmark, IconFlag, IconAlertUser, IconDots,
} from '../icons';
import { DEFAULT_AVATAR } from '../../utils/constants';
import { formatDate } from '../../utils/format';
import './PublicationCard.css';
import './DestacarModal.css';

function isDestacadaActiva(p) {
  if (!p.destacada) return false;
  if (!p.destacada_hasta) return true;
  return new Date(p.destacada_hasta.endsWith('Z') ? p.destacada_hasta : p.destacada_hasta + 'Z') > new Date();
}

export const PublicationCard = React.memo(function PublicationCard({ p, currentUserId, onToggleLike, onOpenChat, onError, onDestacar }) {
  const [profileUserId, setProfileUserId]   = useState(null);
  const [openComments, setOpenComments]     = useState(false);
  const [openResenas, setOpenResenas]       = useState(false);
  const [openReport, setOpenReport]         = useState(false);
  const [openReportUser, setOpenReportUser] = useState(false);
  const [openDestacar, setOpenDestacar]     = useState(false);
  const [openMenu, setOpenMenu]             = useState(false);
  const [isGuardado, setIsGuardado]         = useState(p.user_guardado ?? false);
  const [guardandoLoading, setGuardandoLoading] = useState(false);
  const menuRef = useRef(null);

  const destacadaActiva = isDestacadaActiva(p);
  const esMio = p.usuario_id === currentUserId;

  const [comments, setComments]           = useState([]);
  const [commentCount, setCommentCount]   = useState(p.comentarios_count ?? 0);
  const [resenasCount, setResenasCount]   = useState(p.resenas_count ?? 0);
  const [promedioResenas, setPromedioResenas] = useState(p.promedio_resenas ?? null);
  const [draft, setDraft]                 = useState('');

  const media = p.media_items?.length ? p.media_items : [];
  const texto = p.texto_plano ?? p.descripcion ?? '';
  const tags  = p.hashtags || [];
  const svc   = p.service_detalle;
  const likeCount = p.interacciones_count ?? 0;

  useEffect(() => {
    if (!openMenu) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openMenu]);

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
    if (next) { setOpenResenas(false); loadComments(); }
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

  const handleGuardar = async () => {
    setGuardandoLoading(true);
    try {
      const data = await toggleGuardarPublicacion(p.id);
      setIsGuardado(data.guardado);
    } catch (e) {
      onError(e.message);
    } finally {
      setGuardandoLoading(false);
    }
  };

  const shareLink = async () => {
    const url = `${window.location.origin}/dashboard?post=${p.id}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch { onError('No se pudo copiar el enlace'); }
  };

  const resenasTitle =
    resenasCount > 0 && promedioResenas != null
      ? `Reseñas · ${promedioResenas}★ (${resenasCount})`
      : `Reseñas · ${resenasCount}`;

  return (
    <article className={`pub-card ${destacadaActiva ? 'pub-card-featured' : ''}`}>
      {destacadaActiva && (
        <div className="pub-badge-destacado">⭐ Destacado</div>
      )}

      <header className="pub-card-head">
        <img
          className="pub-avatar"
          src={p.autor_foto || DEFAULT_AVATAR}
          alt=""
          loading="lazy"
          decoding="async"
          style={{ cursor: 'pointer' }}
          onClick={() => setProfileUserId(p.usuario_id)}
        />
        <div className="pub-head-text">
          <div
            className="pub-author"
            style={{ cursor: 'pointer' }}
            onClick={() => setProfileUserId(p.usuario_id)}
          >
            {p.autor_nombre}
            {p.autor_verificado && (
              <span className="pub-badge-verificado" title="Usuario verificado">✓ Verificado</span>
            )}
            {p.autor_plan === 'premium' && (
              <span className="pub-badge-premium" title="Usuario Premium">★ Premium</span>
            )}
          </div>
          <time className="pub-time">{formatDate(p.created_at)}</time>
          {p.autor_ciudad && <div className="pub-loc">📍 {p.autor_ciudad}</div>}
        </div>

        {/* ── Menú 3 puntos ── */}
        <div className="pub-menu-wrap" ref={menuRef}>
          <button
            type="button"
            className="pub-menu-btn"
            onClick={() => setOpenMenu((v) => !v)}
            aria-label="Más opciones"
            title="Más opciones"
          >
            <IconDots />
          </button>
          {openMenu && (
            <div className="pub-menu-dropdown">
              <button type="button" onClick={() => { shareLink(); setOpenMenu(false); }}>
                <IconShare /> Reenviar
              </button>
              <button
                type="button"
                onClick={() => { handleGuardar(); setOpenMenu(false); }}
                disabled={guardandoLoading}
              >
                <IconBookmark saved={isGuardado} />
                {isGuardado ? 'Guardado' : 'Guardar'}
              </button>
              {!esMio && (
                <button
                  type="button"
                  className="danger"
                  onClick={() => { setOpenReport(true); setOpenMenu(false); }}
                >
                  <IconFlag /> Reportar
                </button>
              )}
              {!esMio && (
                <button
                  type="button"
                  className="danger"
                  onClick={() => { setOpenReportUser(true); setOpenMenu(false); }}
                >
                  <IconAlertUser /> Reportar usuario
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {p.categoria_nombre && <div className="pub-cat">{p.categoria_nombre}</div>}
      {p.titulo && <h2 className="pub-title">{p.titulo}</h2>}
      <p className="pub-desc">{texto}</p>

      {tags.length > 0 && (
        <div className="pub-tags">
          {tags.map((t) => (
            <span key={t} className="pub-tag">#{t}</span>
          ))}
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
        <p className="pub-price">
          Desde <strong>{Number(p.precio).toLocaleString('es-CO')}</strong>
        </p>
      )}

      <MediaCarousel items={media} />

      {/* ── Barra de acciones (solo iconos) ── */}
      <footer className="pub-actions">
        <button
          type="button"
          className={`pub-btn pub-like ${p.user_liked ? 'is-on' : ''}`}
          onClick={() => onToggleLike(p.id)}
          aria-label={p.user_liked ? 'Quitar me gusta' : 'Me gusta'}
          title={`Me gusta · ${likeCount}`}
        >
          <IconHeart filled={p.user_liked} />
          {likeCount > 0 && <span>{likeCount}</span>}
        </button>

        <button
          type="button"
          className={`pub-btn pub-resenas ${resenasCount > 0 ? 'has-rating' : ''}`}
          onClick={toggleResenas}
          aria-label={resenasTitle}
          title={resenasTitle}
        >
          <IconStar />
          {resenasCount > 0 && promedioResenas != null && <span>{promedioResenas}★</span>}
          {resenasCount > 0 && <span>({resenasCount})</span>}
        </button>

        <button
          type="button"
          className="pub-btn pub-chat"
          onClick={() => onOpenChat(p.usuario_id, p.id)}
          disabled={p.usuario_id === currentUserId}
          aria-label="Iniciar chat"
          title="Iniciar chat"
        >
          <IconChat />
        </button>

        <button
          type="button"
          className="pub-btn"
          onClick={toggleComments}
          aria-label={`Comentarios · ${commentCount}`}
          title={`Comentarios · ${commentCount}`}
        >
          <IconComment />
          {commentCount > 0 && <span>{commentCount}</span>}
        </button>

        {esMio && !destacadaActiva && (
          <button
            type="button"
            className="pub-btn-destacar"
            onClick={() => setOpenDestacar(true)}
            aria-label="Destacar publicación"
            title="Destacar publicación"
          >
            ⭐
          </button>
        )}
      </footer>

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

      {openComments && (
        <div className="pub-panel pub-panel-reveal">
          <p className="pub-panel-title">Comentarios</p>
          <ul className="pub-comment-list">
            {comments.map((c) => (
              <li key={c.id} className="pub-comment">
                <img src={c.autor_foto || DEFAULT_AVATAR} alt="" className="pub-c-av" />
                <div>
                  <strong>{c.autor_nombre}</strong>
                  <p>{c.contenido}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="pub-comment-form">
            <input
              type="text"
              placeholder="Escribe un comentario…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendComment()}
            />
            <button type="button" onClick={sendComment}>Enviar</button>
          </div>
        </div>
      )}

      {openReport && (
        <ReportModal
          tipo="publicacion"
          targetId={p.id}
          targetLabel={p.titulo}
          onClose={() => setOpenReport(false)}
        />
      )}

      {openReportUser && (
        <ReportModal
          tipo="usuario"
          targetId={p.usuario_id}
          targetLabel={p.autor_nombre}
          onClose={() => setOpenReportUser(false)}
        />
      )}

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
      {profileUserId && (
        <UserPublicProfileModal
          userId={profileUserId}
          onClose={() => setProfileUserId(null)}
        />
      )}
    </article>
  );
});
