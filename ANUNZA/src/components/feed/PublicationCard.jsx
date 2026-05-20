import React, { useState } from 'react';
import { MediaCarousel } from './MediaCarousel';
import { ResenaPanel } from './ResenaPanel';
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
  const [openResenas, setOpenResenas] = useState(false);
  const [openReport, setOpenReport] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentCount, setCommentCount] = useState(p.comentarios_count ?? 0);
  const [resenasCount, setResenasCount] = useState(p.resenas_count ?? 0);
  const [promedioResenas, setPromedioResenas] = useState(p.promedio_resenas ?? null);
  const [draft, setDraft] = useState('');
  const media = p.media_items?.length ? p.media_items : [];
  const texto = p.texto_plano ?? p.descripcion ?? '';
  const tags = p.hashtags || [];
  const svc = p.service_detalle;

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

  const shareLink = async () => {
    const url = `${window.location.origin}/dashboard?post=${p.id}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch { onError('No se pudo copiar el enlace'); }
  };

  const resenasLabel =
    resenasCount > 0 && promedioResenas != null
      ? `Reseñas · ${promedioResenas}★ (${resenasCount})`
      : `Reseñas · ${resenasCount}`;

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
        <button
          type="button"
          className={`pub-btn pub-resenas ${resenasCount > 0 ? 'has-rating' : ''}`}
          onClick={toggleResenas}
        >
          {resenasLabel}
        </button>
        <button
          type="button"
          className="pub-btn pub-chat"
          onClick={() => onOpenChat(p.usuario_id, p.id)}
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
          publicacionId={p.id}
          publicacionTitulo={p.titulo}
          onClose={() => setOpenReport(false)}
        />
      )}
    </article>
  );
}
