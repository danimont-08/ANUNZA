import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MediaCarousel } from './MediaCarousel';
import {
  addResenaApi,
  fetchResenaEligibilidad,
  fetchResenas,
} from '../../models/resenaModel';
import { IconStar } from '../icons';
import { DEFAULT_AVATAR } from '../../utils/constants';
import './ResenaPanel.css';

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function StarsDisplay({ value, size = 'md' }) {
  return (
    <span className={`resena-stars-display resena-stars-display--${size}`} aria-label={`${value} de 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= value ? 'is-on' : ''}><IconStar size={14}/></span>
      ))}
    </span>
  );
}

export function ResenaPanel({
  publicacionId,
  resenasCountInicial = 0,
  promedioInicial = null,
  onResenasChange,
  onError,
}) {
  const [resenas, setResenas] = useState([]);
  const [resenasCount, setResenasCount] = useState(resenasCountInicial);
  const [promedio, setPromedio] = useState(promedioInicial);
  const [elig, setElig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [rating, setRating] = useState(5);
  const [media, setMedia] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [resData, eligData] = await Promise.all([
        fetchResenas(publicacionId),
        fetchResenaEligibilidad(publicacionId),
      ]);
      const list = resData.resenas || [];
      const count = resData.resenas_count ?? list.length;
      const prom = resData.promedio_resenas ?? null;
      setResenas(list);
      setResenasCount(count);
      setPromedio(prom);
      setElig(eligData);
      onResenasChange?.({ count, promedio: prom });
    } catch (e) {
      onError(e.message);
    } finally {
      setLoading(false);
    }
  }, [publicacionId, onResenasChange, onError]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const onPickFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    const next = [...media];
    for (const f of files.slice(0, 8 - next.length)) {
      if (f.size > 18 * 1024 * 1024) {
        onError('Un archivo supera el tamaño máximo (18 MB).');
        continue;
      }
      const isVid = f.type.startsWith('video/');
      const url = await readFileAsDataUrl(f);
      next.push({ url, type: isVid ? 'video' : 'image' });
    }
    setMedia(next);
    e.target.value = '';
  };

  const sendResena = async () => {
    const text = draft.trim();
    if (!text) {
      onError('Escribe tu experiencia en la reseña.');
      return;
    }
    setSubmitting(true);
    try {
      const imagen = media.find((m) => m.type !== 'video');
      const video = media.find((m) => m.type === 'video');
      await addResenaApi(publicacionId, {
        comentario: text,
        puntuacion: rating,
        imagen_url: imagen?.url || null,
        video_url: video?.url || null,
      });
      setDraft('');
      setMedia([]);
      setElig({
        puede_resenar: false,
        ya_reseno: true,
        motivo: 'Ya publicaste una reseña en esta publicación',
      });
      await loadAll();
    } catch (e) {
      onError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const puedePublicar = elig?.puede_resenar;

  return (
    <div className="resena-panel">
      <div className="resena-panel-head">
        <div>
          <p className="resena-panel-title">Reseñas del servicio</p>
          {promedio != null && resenasCount > 0 && (
            <p className="resena-summary">
              <StarsDisplay value={Math.round(promedio)} size="sm" />
              <strong>{promedio}</strong>
              <span className="resena-muted">({resenasCount})</span>
            </p>
          )}
        </div>
      </div>

      {loading && <p className="resena-muted">Cargando reseñas…</p>}

      {!loading && puedePublicar && (
        <div className="resena-form">
          <p className="resena-form-label">Tu calificación</p>
          <div className="resena-stars-input">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className={n <= rating ? 'is-on' : ''}
                onClick={() => setRating(n)}
                aria-label={`${n} estrellas`}
              >
                <IconStar size={14}/>
              </button>
            ))}
          </div>
          <textarea
            rows={3}
            placeholder="Cuéntanos tu experiencia con este servicio…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <div className="resena-media-row">
            <button type="button" className="resena-media-add" onClick={() => fileRef.current?.click()}>
              + Fotos o videos
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              multiple
              hidden
              onChange={onPickFiles}
            />
            {media.length > 0 && (
              <span className="resena-muted">{media.length} archivo(s)</span>
            )}
          </div>
          {media.length > 0 && (
            <ul className="resena-media-previews">
              {media.map((m, i) => (
                <li key={i}>
                  {m.type === 'video' ? (
                    <video src={m.url} muted playsInline />
                  ) : (
                    <img src={m.url} alt="" />
                  )}
                  <button type="button" onClick={() => setMedia((arr) => arr.filter((_, j) => j !== i))}>
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            className="resena-submit"
            onClick={sendResena}
            disabled={submitting}
          >
            {submitting ? 'Publicando…' : 'Publicar reseña'}
          </button>
        </div>
      )}

      {!loading && elig?.ya_reseno && (
        <p className="resena-hint resena-hint--ok">Ya publicaste tu reseña en esta publicación.</p>
      )}

      {!loading && elig?.es_autor && (
        <p className="resena-hint">No puedes reseñar tu propia publicación.</p>
      )}

      {!loading && elig && !puedePublicar && !elig.ya_reseno && !elig.es_autor && elig.motivo && (
        <p className="resena-hint">{elig.motivo}</p>
      )}

      <ul className="resena-list">
        {resenas.length === 0 && !loading && (
          <li className="resena-empty">Aún no hay reseñas. Sé el primero en compartir tu experiencia.</li>
        )}
        {resenas.map((r) => (
          <li key={r.id} className="resena-item">
            <img src={r.autor_foto || DEFAULT_AVATAR} alt="" className="resena-av" />
            <div className="resena-item-body">
              <div className="resena-item-head">
                <strong>{r.autor_nombre}</strong>
                <StarsDisplay value={r.puntuacion} size="sm" />
              </div>
              <p>{r.contenido}</p>
              {r.media_items?.length > 0 && (
                <div className="resena-item-media">
                  <MediaCarousel items={r.media_items} />
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
