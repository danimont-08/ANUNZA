import React, { useCallback, useEffect, useState } from 'react';
import { PublicationComposer } from './PublicationComposer';
import { PublicationCard } from './PublicationCard';
import { FeedFiltersBar } from './FeedFiltersBar';
import {
  fetchCategorias,
  fetchFeed,
  crearPublicacion,
  toggleLikePost,
  toggleFavoritoPost,
  deletePublicacionApi,
} from '../../models/publicacionModel';
import './FeedSection.css';

export function FeedSection({ user, onChatWithUser }) {
  const [items, setItems] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ categoria_id: '', ciudad: '' });

  const loadFeed = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const data = await fetchFeed({
        categoria_id: filters.categoria_id || undefined,
        ciudad: filters.ciudad || undefined,
      });
      setItems(data.publicaciones || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filters.categoria_id, filters.ciudad]);

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
            ? {
                ...p,
                user_liked: data.liked,
                interacciones_count: data.interacciones_count,
              }
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
  };

  const handleToggleFavorito = async (publicacionId) => {
    try {
      const data = await toggleFavoritoPost(publicacionId);
      setItems((prev) =>
        prev.map((p) =>
          p.id === publicacionId ? { ...p, user_saved: data.saved } : p
        )
      );
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDeletePublicacion = async (publicacionId) => {
    try {
      await deletePublicacionApi(publicacionId);
      setItems((prev) => prev.filter((p) => p.id !== publicacionId));
    } catch (e) {
      setError(e.message);
    }
  };

  const handleFilterChange = (patch) => {
    setFilters((f) => ({ ...f, ...patch }));
    setLoading(true);
  };

  const clearFilters = () => {
    setFilters({ categoria_id: '', ciudad: '' });
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

      <PublicationComposer
        categorias={categorias}
        onCreated={handleCreated}
        onError={setError}
      />

      <FeedFiltersBar
        categorias={categorias}
        categoriaId={filters.categoria_id}
        ciudad={filters.ciudad}
        onChange={handleFilterChange}
        onClear={clearFilters}
      />

      <div className="feed-list">
        {items.length === 0 && !error && <p className="feed-empty">No hay publicaciones con estos filtros.</p>}
        {items.map((p) => (
          <PublicationCard
            key={p.id}
            p={p}
            currentUserId={user?.id}
            onToggleLike={handleToggleLike}
            onToggleFavorito={handleToggleFavorito}
            onDeletePublicacion={handleDeletePublicacion}
            onOpenChat={onChatWithUser}
            onError={setError}
          />
        ))}
      </div>
    </section>
  );
}
