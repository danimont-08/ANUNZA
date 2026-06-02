import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { useToast } from '../context/ToastContext';
import { toggleLikePost, toggleGuardarPublicacion } from '../models/publicacionModel';
import { MediaCarousel } from '../components/feed/MediaCarousel';
import { UserPublicProfileModal } from '../components/UserPublicProfileModal';
import {
  IconHeart, IconBookmark, IconShare, IconChat,
  IconStar, IconComment, IconMapPin, IconShieldCheck, IconCrown,
} from '../components/icons';
import { DEFAULT_AVATAR } from '../utils/constants';
import { formatDate, formatCOP } from '../utils/format';
import logo from '../assets/Logo_Anunza.png';
import '../components/Navbar.css';
import '../pages/UserPublicProfile.css';
import './PublicacionPage.css';

export function PublicacionPage() {
  const { pubId } = useParams();
  const navigate  = useNavigate();
  const { user, logout } = useAuth();
  const showToast = useToast();

  const [pub, setPub]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [liking, setLiking]   = useState(false);
  const [saving, setSaving]   = useState(false);
  const [profileUid, setProfileUid] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch(`/feed/publicaciones/${pubId}`);
      setPub(data.publicacion);
    } catch (e) {
      setError(e.message || 'No se encontró la publicación');
    } finally {
      setLoading(false);
    }
  }, [pubId]);

  useEffect(() => { load(); }, [load]);

  const handleLike = async () => {
    if (!pub || liking) return;
    setLiking(true);
    const prev = { user_liked: pub.user_liked, interacciones_count: pub.interacciones_count };
    setPub((p) => ({ ...p, user_liked: !p.user_liked, interacciones_count: p.interacciones_count + (!p.user_liked ? 1 : -1) }));
    try {
      const data = await toggleLikePost(pub.id);
      setPub((p) => ({ ...p, user_liked: data.liked, interacciones_count: data.interacciones_count }));
    } catch {
      setPub((p) => ({ ...p, ...prev }));
      showToast('Error al dar me gusta', 'error');
    } finally { setLiking(false); }
  };

  const handleSave = async () => {
    if (!pub || saving) return;
    setSaving(true);
    try {
      const data = await toggleGuardarPublicacion(pub.id);
      setPub((p) => ({ ...p, user_guardado: data.guardado }));
      showToast(data.guardado ? 'Guardado en tu historial' : 'Eliminado de guardados', 'success');
    } catch { showToast('Error al guardar', 'error'); }
    finally { setSaving(false); }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/pub/${pubId}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast('Enlace copiado', 'success');
    } catch {
      showToast('No se pudo copiar el enlace', 'error');
    }
  };

  const handleChat = () => {
    if (!pub) return;
    navigate('/dashboard', {
      state: {
        openSection: 'mensajes',
        bootstrapUserId: pub.usuario_id,
        bootstrapPubId: pub.id,
        bootstrapPubTitulo: pub.titulo,
      },
    });
  };

  const esMio = pub?.usuario_id === user?.id;
  const media = pub?.media_items?.length ? pub.media_items : [];
  const texto = pub?.texto_plano ?? pub?.descripcion ?? '';

  return (
    <div className="pp-root">
      <header className="anunza-navbar">
        <div className="anunza-navbar-inner">
          <Link to="/dashboard" className="anunza-navbar-brand">
            <img src={logo} alt="ANUNZA" className="anunza-navbar-logo" />
          </Link>
          <div className="anunza-navbar-actions">
            <button type="button" className="anunza-navbar-logout" onClick={() => navigate(-1)}>
              ← Volver
            </button>
            <button type="button" className="anunza-navbar-logout" onClick={() => { logout(); navigate('/login'); }}>
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="pp-main">
        {loading && <p className="upp2-loading">Cargando publicación…</p>}
        {error   && <p className="upp2-error">{error}</p>}

        {pub && !loading && (
          <>
            {/* Media */}
            {media.length > 0 && (
              <div className="pp-media">
                <MediaCarousel items={media} />
              </div>
            )}

            <div className="pp-body">
              {/* Chips tipo + categoría */}
              <div className="pp-chips">
                <span className={`upp2-chip ${pub.tipo === 'busco' ? 'upp2-chip--busco' : 'upp2-chip--ofrezco'}`}>
                  {pub.tipo === 'busco' ? 'Busco' : 'Ofrezco'}
                </span>
                {pub.categoria_nombre && <span className="upp2-chip upp2-chip--cat">{pub.categoria_nombre}</span>}
                {pub.subcategoria_nombre && <span className="upp2-chip upp2-chip--cat">{pub.subcategoria_nombre}</span>}
              </div>

              <h1 className="pp-title">{pub.titulo}</h1>

              {pub.precio != null && (
                <p className="pp-price">{formatCOP(pub.precio)}</p>
              )}

              {/* Autor */}
              <button type="button" className="pp-author" onClick={() => setProfileUid(pub.usuario_id)}>
                <img src={pub.autor_foto || DEFAULT_AVATAR} alt="" className="pp-author-avatar" />
                <div className="pp-author-info">
                  <span className="pp-author-name">
                    {pub.autor_nombre}
                    {pub.autor_verificado && <IconShieldCheck size={13}/>}
                    {pub.autor_plan === 'premium' && <IconCrown size={13}/>}
                  </span>
                  <span className="pp-author-meta">
                    {pub.autor_ciudad && <><IconMapPin size={12}/> {pub.autor_ciudad} · </>}
                    {formatDate(pub.created_at)}
                  </span>
                </div>
              </button>

              {/* Descripción */}
              {texto.trim() && (
                <section className="pp-desc">
                  <p>{texto}</p>
                </section>
              )}

              {/* Hashtags */}
              {pub.hashtags?.length > 0 && (
                <div className="pp-tags">
                  {pub.hashtags.map((h) => <span key={h} className="pp-tag">#{h}</span>)}
                </div>
              )}

              {/* Stats */}
              <div className="pp-stats">
                <span><IconHeart size={15}/> {pub.interacciones_count ?? 0} me gusta</span>
                <span><IconComment size={15}/> {pub.comentarios_count ?? 0} comentarios</span>
                {pub.resenas_count > 0 && <span><IconStar size={15}/> {pub.promedio_resenas} ({pub.resenas_count})</span>}
              </div>

              {/* Acciones */}
              <div className="pp-actions">
                <button
                  type="button"
                  className={`pp-action-btn${pub.user_liked ? ' active' : ''}`}
                  onClick={handleLike}
                  disabled={liking}
                >
                  <IconHeart size={20} filled={pub.user_liked}/>
                  <span>{pub.user_liked ? 'Me gusta' : 'Me gusta'}</span>
                </button>

                <button
                  type="button"
                  className={`pp-action-btn${pub.user_guardado ? ' active' : ''}`}
                  onClick={handleSave}
                  disabled={saving}
                >
                  <IconBookmark size={20} saved={pub.user_guardado}/>
                  <span>{pub.user_guardado ? 'Guardado' : 'Guardar'}</span>
                </button>

                <button type="button" className="pp-action-btn" onClick={handleShare}>
                  <IconShare size={20}/>
                  <span>Compartir</span>
                </button>

                {!esMio && (
                  <button type="button" className="pp-action-btn pp-action-btn--chat" onClick={handleChat}>
                    <IconChat size={20}/>
                    <span>Contactar</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                className="pp-open-feed"
                onClick={() => navigate('/dashboard', { state: { openSection: 'inicio', highlightId: pub.id } })}
              >
                Ver en el feed de ANUNZA
              </button>
            </div>
          </>
        )}
      </main>

      {profileUid && (
        <UserPublicProfileModal
          userId={profileUid}
          onClose={() => setProfileUid(null)}
        />
      )}
    </div>
  );
}
