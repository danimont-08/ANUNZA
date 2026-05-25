import React, { useState, useEffect } from 'react';
import './MediaCarousel.css';

export function MediaCarousel({ items }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    setIdx(0);
  }, [items]);
  if (!items || items.length === 0) return null;
  const safe = Math.min(idx, items.length - 1);
  const cur = items[safe];

  const prev = () => setIdx((i) => (i <= 0 ? items.length - 1 : i - 1));
  const next = () => setIdx((i) => (i >= items.length - 1 ? 0 : i + 1));

  return (
    <div className="mc-carousel">
      <div className="mc-viewport">
        {cur.type === 'video' ? (
          <video className="mc-media" src={cur.url} controls playsInline />
        ) : (
          <img className="mc-media" src={cur.url} alt="" loading="lazy" decoding="async" />
        )}
      </div>
      {items.length > 1 && (
        <>
          <button type="button" className="mc-nav mc-prev" aria-label="Anterior" onClick={prev}>
            ‹
          </button>
          <button type="button" className="mc-nav mc-next" aria-label="Siguiente" onClick={next}>
            ›
          </button>
          <div className="mc-dots">
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`mc-dot ${i === safe ? 'is-active' : ''}`}
                onClick={() => setIdx(i)}
                aria-label={`Foto ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
