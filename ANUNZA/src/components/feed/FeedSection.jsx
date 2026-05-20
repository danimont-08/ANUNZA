import React, { useCallback, useEffect, useState } from 'react';
import { PublicationComposer } from './PublicationComposer';
import { PublicationCard } from './PublicationCard';
import FiltrosServicios from '../FiltrosServicios';
import {
  fetchCategorias,
  fetchFeed,
  crearPublicacion,
  toggleLikePost,
} from '../../models/publicacionModel';
import './FeedSection.css';

export function FeedSection({ user, onChatWithUser }) {
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
        const data = await fetchCategorias();
        setCategorias(data.categorias || []);
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
    const data = await crearPublicacion(body);
    setItems((prev) => [data.publicacion, ...prev]);
    setShowComposer(false); // cierra el formulario tras publicar
  };

  const handleFilterChange = (patch) => {
    setFilters((f) => ({ ...f, ...patch }));
    setLoading(true);
  };

  const clearFilters = () => {
    setFilters({ 
      categoria: '', 
      subcategoria: '',
      ciudad: '',
      precioMin: '',
      precioMax: '',
      calificacionMin: ''
    });
    setLoading(true);
  };

  if (loading && items.length === 0 && !error) {
    return (
      <div className="feed-wrap">
        <div className="feed-loading">Cargando publicaciones…</div>
      </div>
    );
  }

  return (
    <section className="feed-wrap feed-section">
      <div className="feed-header">
        <h1>Inicio</h1>
        <p className="feed-sub">Servicios y talento en ANUNZA</p>
      </div>

      {error && <div className="feed-error">{error}</div>}

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

      <FiltrosServicios
        filtros={filters}
        onChange={handleFilterChange}
      />

      <div className="feed-list">
        {items.length === 0 && !error && (
          <p className="feed-empty">No hay publicaciones con estos filtros.</p>
        )}
        {items.map((p) => (
          <PublicationCard
            key={p.id}
            p={p}
            currentUserId={user?.id}
            onToggleLike={handleToggleLike}
            onOpenChat={(uid, pubId) => onChatWithUser(uid, pubId)}
            onError={setError}
          />
        ))}
      </div>
    </section>
  );
}
