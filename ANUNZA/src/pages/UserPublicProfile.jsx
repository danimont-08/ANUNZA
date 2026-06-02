import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { DEFAULT_AVATAR } from '../utils/constants';
import { formatDate, formatCOP } from '../utils/format';
import { IconHeart, IconChat, IconMapPin, IconShieldCheck } from '../components/icons';
import logo from '../assets/Logo_Anunza.png';
import '../components/Navbar.css';
import './UserPublicProfile.css';

function PubCard({ pub, onClick }) {
  return (
    <article className="upp2-pub-card" onClick={onClick}>
      {pub.imagen_preview
        ? <img src={pub.imagen_preview} alt="" className="upp2-pub-img" />
        : <div className="upp2-pub-img upp2-pub-img--empty" />}
      <div className="upp2-pub-body">
        <div className="upp2-pub-chips">
          <span className={`upp2-chip ${pub.tipo === 'busco' ? 'upp2-chip--busco' : 'upp2-chip--ofrezco'}`}>
            {pub.tipo === 'busco' ? 'Busco' : 'Ofrezco'}
          </span>
          {pub.categoria_nombre && (
            <span className="upp2-chip upp2-chip--cat">{pub.categoria_nombre}</span>
          )}
        </div>
        <p className="upp2-pub-title">{pub.titulo}</p>
        {pub.precio != null && (
          <p className="upp2-pub-price">{formatCOP(pub.precio)}</p>
        )}
        <div className="upp2-pub-stats">
          <span><IconHeart size={14}/> {pub.likes ?? 0}</span>
          <span><IconChat size={14}/> {pub.comentarios_count ?? 0}</span>
        </div>
        <p className="upp2-pub-date">{formatDate(pub.created_at)}</p>
      </div>
    </article>
  );
}

export function UserPublicProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: me, logout } = useAuth();

  const [perfil, setPerfil] = useState(null);
  const [pubs, setPubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [perfilData, pubsData] = await Promise.all([
        apiFetch(`/users/${userId}/public`),
        apiFetch(`/users/${userId}/publicaciones`),
      ]);
      setPerfil(perfilData.user);
      setPubs(pubsData.publicaciones || []);
    } catch (e) {
      setError(e.message || 'No se pudo cargar el perfil');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const esMiPerfil = me?.id === userId || me?.id === Number(userId);

  return (
    <div className="upp2-root">
      {/* Navbar mínimo */}
      <header className="anunza-navbar">
        <div className="anunza-navbar-inner">
          <Link to="/dashboard" className="anunza-navbar-brand">
            <img src={logo} alt="ANUNZA" className="anunza-navbar-logo" />
          </Link>
          <div className="anunza-navbar-actions">
            <button
              type="button"
              className="anunza-navbar-logout"
              onClick={() => navigate(-1)}
            >
              ← Volver
            </button>
            <button
              type="button"
              className="anunza-navbar-logout"
              onClick={() => { logout(); navigate('/login'); }}
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="upp2-main">
        {loading && <p className="upp2-loading">Cargando perfil…</p>}
        {error && <p className="upp2-error">{error}</p>}

        {perfil && !loading && (
          <>
            {/* Cover + info */}
            <section className="upp2-hero">
              <div
                className="upp2-cover"
                style={perfil.foto_portada ? {
                  backgroundImage: `url(${perfil.foto_portada})`,
                  backgroundSize: 'cover',
                  backgroundPosition: perfil.foto_portada_pos || '50% 50%',
                } : undefined}
              />
              <div className="upp2-hero-content">
                <img
                  src={perfil.foto_perfil || DEFAULT_AVATAR}
                  alt=""
                  className="upp2-avatar"
                />
                <div className="upp2-identity">
                  <h1 className="upp2-name">
                    {perfil.nombre}
                    {perfil.verificado && (
                      <span className="upp2-verified" title="Usuario verificado"><IconShieldCheck size={14}/></span>
                    )}
                  </h1>
                  <div className="upp2-meta-row">
                    {perfil.ciudad && <span><IconMapPin size={14}/> {perfil.ciudad}</span>}
                    <span>Miembro desde {formatDate(perfil.created_at)}</span>
                  </div>
                  <div className="upp2-stats-row">
                    <div className="upp2-stat">
                      <span className="upp2-stat-num">{perfil.total_publicaciones ?? pubs.length}</span>
                      <span className="upp2-stat-label">publicaciones</span>
                    </div>
                    <div className="upp2-stat">
                      <span className="upp2-stat-num">{perfil.total_likes ?? 0}</span>
                      <span className="upp2-stat-label">me gusta recibidos</span>
                    </div>
                  </div>
                </div>
                {esMiPerfil && (
                  <div className="upp2-hero-actions">
                    <button
                      type="button"
                      className="upp2-btn-primary"
                      onClick={() => navigate('/dashboard', { state: { openSection: 'perfil' } })}
                    >
                      Editar perfil
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* Descripción */}
            {perfil.descripcion && (
              <section className="upp2-about">
                <p>{perfil.descripcion}</p>
              </section>
            )}

            {/* Publicaciones */}
            <section className="upp2-pubs-section">
              <h2 className="upp2-pubs-title">
                Publicaciones
                <span className="upp2-pubs-count">{pubs.length}</span>
              </h2>
              {pubs.length === 0 ? (
                <p className="upp2-empty">Este usuario no tiene publicaciones activas.</p>
              ) : (
                <div className="upp2-pubs-grid">
                  {pubs.map(pub => (
                    <PubCard
                      key={pub.id}
                      pub={pub}
                      onClick={() => navigate('/dashboard', { state: { highlightId: pub.id } })}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
