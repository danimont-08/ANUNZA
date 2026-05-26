import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import './FeedSection.css';

export function FeedSection({ user, onChatWithUser, highlightPublicacionId, onHighlightConsumed }) {
  const [items, setItems] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ 
    categoria: '', 
    subcategoria: '',
    ciudad: '',
    precioMin: '',
    precioMax: '',
    calificacionMin: ''
  });
  const [showComposer, setShowComposer] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [miEstado, setMiEstado] = useState(null);
  const cardRefs = useRef({});

  const loadFeed = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const data = await fetchFeed({
        categoria_id: filters.categoria || undefined,
        subcategoria_id: filters.subcategoria || undefined,
        ciudad: filters.ciudad || undefined,
        precio_min: filters.precioMin || undefined,
        precio_max: filters.precioMax || undefined,
        calificacion_min: filters.calificacionMin || undefined,
      });
      setItems(data.publicaciones || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

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

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const handleToggleLike = async (publicacionId) => {
    try {
      const data = await toggleLikePost(publicacionId);
      setItems((prev) =>
        prev.map((p) =>
          p.id === publicacionId
            ? { ...p, user_liked: data.liked, interacciones_count: data.interacciones_count }
            : p
        )
      );
    } catch (e) {
      setError(e.message);
    }
  };

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

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  if (loading && items.length === 0 && !error) {
    return (
      <div className="feed-wrap">
        <div className="feed-loading">Cargando publicaciones…</div>
      </div>
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
            ✕
          </button>
          <PublicationComposer
            categorias={categorias}
            onCreated={handleCreated}
            onError={setError}
          />
        </div>
      )}

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
        {showFilters ? 'Ocultar filtros' : 'Filtrar servicios'}
      </button>
      <div className={`feed-filters-panel${showFilters ? ' is-open' : ''}`}>
        <FiltrosServicios
          onChange={handleFilterChange}
        />
      </div>

      <div className="feed-list">
        {items.length === 0 && !error && (
          <p className="feed-empty">No hay publicaciones con estos filtros.</p>
        )}
        {items.map((p) => (
          <div key={p.id} ref={(el) => { cardRefs.current[p.id] = el; }}>
            <PublicationCard
              p={p}
              currentUserId={user?.id}
              onToggleLike={handleToggleLike}
              onOpenChat={(uid, pubId, titulo) => onChatWithUser(uid, pubId, titulo)}
              onError={setError}
              onDestacar={handleDestacar}
              onDelete={handleDelete}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
