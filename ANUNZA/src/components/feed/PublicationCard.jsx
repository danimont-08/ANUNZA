import React, { useState } from 'react';
import { MediaCarousel } from './MediaCarousel';
import {
  fetchComentarios,
  addComentarioApi,
} from '../../models/publicacionModel';
import { ReportModal } from './ReportModal';
import './PublicationCard.css';

const DEFAULT_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23b0aac8'%3E%3Ccircle cx='12' cy='8' r='4'/%3E%3Cpath d='M4 20c0-4 3.6-7 8-7s8 3 8 7'/%3E%3C/svg%3E";

function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch { return ''; }
}

export function PublicationCard({ p, currentUserId, onToggleLike, onOpenChat, onError }) {
  const [openComments, setOpenComments] = useState(false);
  const [openResena, setOpenResena] = useState(false);
  const [openReport, setOpenReport] = useState(false);
  const [comments, setComments] = useState([]);
  // Tomar comentarios_count del servidor (count real de todos los comentarios)
  const [commentCount, setCommentCount] = useState(p.comentarios_count ?? 0);
  const [draft, setDraft] = useState('');
  const [resenaDraft, setResenaDraft] = useState('');
  const [rating, setRating] = useState(5);

  const media = p.media_items?.length ? p.media_items : [];
  const texto = p.texto_plano ?? p.descripcion ?? '';
  const tags = p.hashtags || [];
  const svc = p.service_detalle;

  const loadComments = async () => {
    try {
      const data = await fetchComentarios(p.id);
      setComments(data.comentarios || []);
      // Sincronizar el contador con la respuesta real del servidor
      setCommentCount(data.comentarios?.length ?? commentCount);
    } catch (e) { onError(e.message); }
  };

  const toggleComments = () => {
    const next = !openComments;
    setOpenComments(next);
    if (next) loadComments();
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
    const prefix = `[Reseña ${rating}/5] `;
    try {
      const data = await addComentarioApi(p.id, `${prefix}${text}`);
      setResenaDraft('');
      setOpenResena(false);
      setOpenComments(true);
      setComments((c) => [...c, data.comentario]);
      setCommentCount((n) => n + 1);
    } catch (e) { onError(e.message); }
  };

  const shareLink = async () => {
    const url = `${window.location.origin}/dashboard?post=${p.id}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch { onError('No se pudo copiar el enlace'); }
  };

  return (
    <article className="pub-card">
      <header className="pub-card-head">
        <img className="pub-avatar" src={p.autor_foto || DEFAULT_AVATAR} alt="" />
        <div className="pub-head-text">
          <div className="pub-author">{p.autor_nombre}</div>
          <time className="pub-time">{formatDate(p.created_at)}</time>
          {p.autor_ciudad && <div className="pub-loc">📍 {p.autor_ciudad}</div>}
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
          {svc.materiales && <p><strong>Materiales:</strong> {svc.materiales}</p>}
          {svc.tiempo_estimado && <p><strong>Tiempo estimado:</strong> {svc.tiempo_estimado}</p>}
          {svc.detalles && <p><strong>Detalles:</strong> {svc.detalles}</p>}
        </div>
      )}

      {p.precio != null && Number(p.precio) > 0 && (
        <p className="pub-price">
          Desde <strong>{Number(p.precio).toLocaleString('es-CO')}</strong>
        </p>
      )}

      <MediaCarousel items={media} />

      <footer className="pub-actions">
        <button
          type="button"
          className={`pub-btn pub-like ${p.user_liked ? 'is-on' : ''}`}
          onClick={() => onToggleLike(p.id)}
        >
          {p.user_liked ? 'Te gusta' : 'Me gusta'} · {p.interacciones_count ?? 0}
        </button>
        <button type="button" className="pub-btn" onClick={shareLink}>Reenviar</button>
        <button type="button" className="pub-btn" onClick={() => setOpenResena((v) => !v)}>Reseñar</button>
        <button
          type="button"
          className="pub-btn pub-chat"
          onClick={() => onOpenChat(p.usuario_id)}
          disabled={p.usuario_id === currentUserId}
        >
          Chat
        </button>
        <button type="button" className="pub-btn" onClick={toggleComments}>
          Comentar · {commentCount}
        </button>
        <button
          type="button"
          className="pub-btn pub-report"
          onClick={() => setOpenReport(true)}
        >
          Reportar
        </button>
      </footer>

      {openResena && (
        <div className="pub-panel pub-panel-reveal">
          <p className="pub-panel-title">Reseña del servicio</p>
          <div className="pub-stars">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className={n <= rating ? 'is-on' : ''}
                onClick={() => setRating(n)}
              >★</button>
            ))}
          </div>
          <textarea
            rows={3}
            placeholder="Cuéntanos tu experiencia…"
            value={resenaDraft}
            onChange={(e) => setResenaDraft(e.target.value)}
          />
          <button type="button" className="pub-send" onClick={sendResena}>
            Publicar reseña
          </button>
        </div>
      )}

      {openComments && (
        <div className="pub-panel pub-panel-reveal">
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
          publicacionId={p.id}
          publicacionTitulo={p.titulo}
          onClose={() => setOpenReport(false)}
        />
      )}
    </article>
  );
}
