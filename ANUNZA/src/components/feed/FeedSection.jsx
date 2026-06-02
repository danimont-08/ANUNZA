import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { PublicationComposer } from './PublicationComposer';
import { PublicationCard } from './PublicationCard';
import FiltrosServicios from '../FiltrosServicios';
import { PlanPremiumModal } from '../PlanPremiumModal';
import {
  fetchCategorias,
  fetchFeed,
  crearPublicacion,
  toggleLikePost,
} from '../../models/publicacionModel';
import { fetchMiEstado } from '../../models/pagosModel';
import { IconX } from '../icons';
import { FeedSkeleton } from './FeedSkeleton';
import './FeedSection.css';

const LIMIT = 20;

export function FeedSection({ user, onChatWithUser, highlightPublicacionId, onHighlightConsumed }) {
  const [items, setItems] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hayMas, setHayMas] = useState(false);
  const [nextOffset, setNextOffset] = useState(0);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [tipo, setTipo] = useState('');
  const [filters, setFilters] = useState({
    categoria: '',
    subcategoria: '',
    ciudad: '',
    precioMin: '',
    precioMax: '',
    calificacionMin: '',
  });
  const [showComposer, setShowComposer] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [miEstado, setMiEstado] = useState(null);
  const cardRefs   = useRef({});
  const searchTimer = useRef(null);
  const sentinelRef = useRef(null);

  const buildParams = useCallback((offset = 0) => ({
    categoria_id: filters.categoria || undefined,
    subcategoria_id: filters.subcategoria || undefined,
    ciudad: filters.ciudad || undefined,
    precio_min: filters.precioMin || undefined,
    precio_max: filters.precioMax || undefined,
    calificacion_min: filters.calificacionMin || undefined,
    q: busqueda.trim() || undefined,
    tipo: tipo || undefined,
    limit: LIMIT,
    offset,
  }), [filters, busqueda, tipo]);

  const loadFeed = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const data = await fetchFeed(buildParams(0));
      setItems(data.publicaciones || []);
      setHayMas(data.hay_mas ?? false);
      setNextOffset(data.offset ?? (data.publicaciones || []).length);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  const loadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await fetchFeed(buildParams(nextOffset));
      setItems((prev) => [...prev, ...(data.publicaciones || [])]);
      setHayMas(data.hay_mas ?? false);
      setNextOffset(data.offset ?? nextOffset + (data.publicaciones || []).length);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const [catData, estadoData] = await Promise.all([fetchCategorias(), fetchMiEstado()]);
        setCategorias(catData.categorias || []);
        setMiEstado(estadoData);
      } catch (e) {
        setError(e.message);
      }
    })();
  }, []);

  // Debounce búsqueda: espera 400ms tras el último keystroke
  const handleBusqueda = (val) => {
    setBusqueda(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {}, 0); // El loadFeed se dispara vía useEffect
  };

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  // Optimistic like: actualiza estado al instante, revierte si falla
  const handleToggleLike = async (publicacionId) => {
    setItems((prev) =>
      prev.map((p) =>
        p.id === publicacionId
          ? {
              ...p,
              user_liked: !p.user_liked,
              interacciones_count: p.interacciones_count + (!p.user_liked ? 1 : -1),
            }
          : p
      )
    );
    try {
      const data = await toggleLikePost(publicacionId);
      setItems((prev) =>
        prev.map((p) =>
          p.id === publicacionId
            ? { ...p, user_liked: data.liked, interacciones_count: data.interacciones_count }
            : p
        )
      );
    } catch {
      // Revertir si falla
      setItems((prev) =>
        prev.map((p) =>
          p.id === publicacionId
            ? {
                ...p,
                user_liked: !p.user_liked,
                interacciones_count: p.interacciones_count + (p.user_liked ? 1 : -1),
              }
            : p
        )
      );
    }
  };

  // Infinite scroll con IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current || !hayMas || loadingMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { threshold: 0.1 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hayMas, loadingMore, nextOffset]); // eslint-disable-line

  const handleCreated = async (body) => {
    try {
      const data = await crearPublicacion(body);
      setItems((prev) => [data.publicacion, ...prev]);
      setShowComposer(false);
      // Refrescar estado del plan tras publicar
      fetchMiEstado().then(setMiEstado).catch(() => {});
    } catch (e) {
      if (e.limit_reached) {
        setShowComposer(false);
        setShowPremiumModal(true);
      } else {
        throw e;
      }
    }
  };

  const handleDestacar = (publicacionId, data) => {
    setItems((prev) =>
      prev.map((p) =>
        p.id === publicacionId
          ? { ...p, destacada: true, destacada_hasta: data.destacada_hasta }
          : p
      )
    );
  };

  const handleDelete = (publicacionId) => {
    setItems((prev) => prev.filter((p) => p.id !== publicacionId));
  };

  const handleUpdate = (updated) => {
    setItems((prev) => prev.map((p) => p.id === updated.id ? { ...p, ...updated } : p));
  };

  // Scroll y resaltado al publicación desde notificación
  useEffect(() => {
    if (!highlightPublicacionId || loading) return;
    const el = cardRefs.current[highlightPublicacionId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('feed-card-highlight');
      const t = setTimeout(() => {
        el.classList.remove('feed-card-highlight');
        onHighlightConsumed?.();
      }, 2500);
      return () => clearTimeout(t);
    }
  }, [highlightPublicacionId, loading, onHighlightConsumed]);

  const handleFilterChange = (newFilters) => setFilters(newFilters);

  const handleNavigateToPost = (pubId) => {
    const el = cardRefs.current[pubId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('feed-card-highlight');
      setTimeout(() => el.classList.remove('feed-card-highlight'), 2500);
    }
  };

  const handleHashtagClick = (tag) => {
    setBusqueda(tag);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategoryPill = (catId) => {
    setFilters((prev) => ({ ...prev, categoria: prev.categoria === catId ? '' : catId, subcategoria: '' }));
  };

  if (loading && items.length === 0 && !error) {
    return (
      <section className="feed-wrap feed-section">
        <div className="feed-header">
          <h1>Inicio</h1>
          <p className="feed-sub">Servicios y talento en ANUNZA</p>
        </div>
        <FeedSkeleton count={4} />
      </section>
    );
  }

  const limitAlcanzado =
    miEstado?.plan === 'gratuito' &&
    miEstado?.limite != null &&
    miEstado?.publicaciones_activas >= miEstado.limite;

  return (
    <section className="feed-wrap feed-section">
      <div className="feed-header">
        <h1>Inicio</h1>
        <p className="feed-sub">Servicios y talento en ANUNZA</p>
      </div>

      {/* Banner de límite gratuito */}
      {miEstado?.plan === 'gratuito' && (
        <div className={`feed-plan-banner ${limitAlcanzado ? 'feed-plan-limit' : ''}`}>
          {limitAlcanzado ? (
            <>
              <span>Has alcanzado el límite de <strong>{miEstado.limite} publicaciones</strong> del plan gratuito.</span>
              <button type="button" className="feed-plan-upgrade" onClick={() => setShowPremiumModal(true)}>
                Actualizar a Premium
              </button>
            </>
          ) : (
            <>
              <span>
                Plan gratuito · {miEstado.publicaciones_activas}/{miEstado.limite} publicaciones usadas
              </span>
              <button type="button" className="feed-plan-upgrade" onClick={() => setShowPremiumModal(true)}>
                Ver Premium
              </button>
            </>
          )}
        </div>
      )}

      {error && <div className="feed-error">{error}</div>}

      {showPremiumModal && (
        <PlanPremiumModal
          onClose={() => setShowPremiumModal(false)}
          onSuccess={(data) => {
            setShowPremiumModal(false);
            setMiEstado((prev) => ({ ...prev, plan: 'premium', limite: null }));
          }}
        />
      )}

      {/* Botón morado oscuro para abrir el formulario */}
      {!showComposer && (
        <button
          type="button"
          className="feed-new-btn"
          onClick={() => setShowComposer(true)}
        >
          Nueva publicación
        </button>
      )}

      {/* Formulario desplegable con animación slideUp */}
      {showComposer && (
        <div className="feed-composer-wrap animate-slide-up">
          <button
            type="button"
            className="feed-composer-close"
            onClick={() => setShowComposer(false)}
            title="Cerrar formulario"
          >
            <IconX size={16}/>
          </button>
          <PublicationComposer
            categorias={categorias}
            onCreated={handleCreated}
            onError={setError}
          />
        </div>
      )}

      {/* Category pills */}
      {categorias.length > 0 && (
        <div className="feed-cat-pills-wrap">
          <div className="feed-cat-pills" role="list" aria-label="Filtrar por categoría">
            {categorias.map((cat) => (
              <button
                key={cat.id}
                type="button"
                role="listitem"
                className={`feed-cat-pill${filters.categoria === cat.id ? ' active' : ''}`}
                onClick={() => handleCategoryPill(cat.id)}
              >
                {cat.nombre}
              </button>
            ))}
          </div>
          <div className="feed-cat-pills-fade" aria-hidden="true" />
        </div>
      )}

      {/* Barra de búsqueda */}
      <div className="feed-search-bar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          placeholder="Buscar publicaciones…"
          value={busqueda}
          onChange={(e) => handleBusqueda(e.target.value)}
          className="feed-search-input"
        />
        {busqueda && (
          <button type="button" className="feed-search-clear" onClick={() => setBusqueda('')} aria-label="Limpiar búsqueda">
            <IconX size={14}/>
          </button>
        )}
      </div>

      {/* Pills de tipo */}
      <div className="feed-tipo-pills">
        {[['', 'Todos'], ['ofrezco', 'Ofrezco'], ['busco', 'Busco']].map(([val, label]) => (
          <button
            key={val}
            type="button"
            className={`feed-tipo-pill${tipo === val ? ' active' : ''}`}
            onClick={() => setTipo(val)}
          >
            {label}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="feed-filters-toggle"
        onClick={() => setShowFilters((v) => !v)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="4" y1="6" x2="20" y2="6"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
          <line x1="11" y1="18" x2="13" y2="18"/>
        </svg>
        {showFilters ? 'Ocultar filtros' : 'Más filtros'}
        {(filters.categoria || filters.ciudad || filters.precioMin || filters.precioMax || filters.calificacionMin) && (
          <span className="feed-filters-dot"/>
        )}
      </button>
      <div className={`feed-filters-panel${showFilters ? ' is-open' : ''}`}>
        <FiltrosServicios onChange={handleFilterChange} />
      </div>

      <div className="feed-list">
        {items.length === 0 && !loading && !error && (
          <div className="feed-empty-state">
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true">
              <circle cx="36" cy="36" r="36" fill="#ede8ff"/>
              <path d="M24 46c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="#8a4eff" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="28" cy="30" r="3" fill="#8a4eff" opacity=".6"/>
              <circle cx="44" cy="30" r="3" fill="#8a4eff" opacity=".6"/>
              <path d="M20 52h32" stroke="#c4b5f7" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <p className="feed-empty-title">Sin resultados</p>
            <p className="feed-empty-sub">
              {busqueda
                ? `No encontramos publicaciones para "${busqueda}"`
                : 'No hay publicaciones con estos filtros'}
            </p>
          </div>
        )}
        {items.map((p) => (
          <div key={p.id} ref={(el) => { cardRefs.current[p.id] = el; }}>
            <PublicationCard
              p={p}
              currentUserId={user?.id}
              onToggleLike={handleToggleLike}
              onUpdate={handleUpdate}
              onHashtagClick={handleHashtagClick}
              onNavigateToPost={handleNavigateToPost}
              onOpenChat={(uid, pubId, titulo) => onChatWithUser(uid, pubId, titulo)}
              onError={setError}
              onDestacar={handleDestacar}
              onDelete={handleDelete}
            />
          </div>
        ))}
      </div>

      {/* Sentinel para infinite scroll */}
      {hayMas && (
        <div ref={sentinelRef} className="feed-sentinel" aria-hidden="true">
          {loadingMore && <FeedSkeleton count={2} />}
        </div>
      )}
    </section>
  );
}
