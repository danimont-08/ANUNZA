import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlanPremiumModal } from './PlanPremiumModal';
import { fetchMiEstado } from '../models/pagosModel';
import { apiFetch } from '../services/api';
import { geolocateToCity, osmEmbedUrl } from '../utils/geolocate';
import { DEFAULT_AVATAR } from '../utils/constants';
import { formatDate } from '../utils/format';
import './ProfileSection.css';
import '../pages/UserPublicProfile.css';

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
          <p className="upp2-pub-price">${Number(pub.precio).toLocaleString('es-CO')}</p>
        )}
        <div className="upp2-pub-stats">
          <span>♥ {pub.likes ?? 0}</span>
          <span>💬 {pub.comentarios_count ?? 0}</span>
        </div>
        <p className="upp2-pub-date">{formatDate(pub.created_at)}</p>
      </div>
    </article>
  );
}

export function ProfileSection({ user, updateProfile, onError }) {
  const navigate = useNavigate();
  const [editing, setEditing]               = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [miEstado, setMiEstado]             = useState(null);
  const [pubs, setPubs]                     = useState([]);
  const [pubsLoading, setPubsLoading]       = useState(false);
  const [geoLoading, setGeoLoading]         = useState(false);
  const [geoData, setGeoData]               = useState(null);
  const [geoError, setGeoError]             = useState('');
  const [data, setData] = useState({
    nombre:          '',
    correo:          '',
    telefono:        '',
    descripcion:     '',
    ciudad:          '',
    latitud:         '',
    longitud:        '',
    foto_perfil:     '',
    foto_portada:    '',
    foto_portada_pos:'50% 50%',
  });
  const [adjusting, setAdjusting]   = useState(false);
  const [dragStart, setDragStart]   = useState(null);
  const coverDivRef                 = useRef(null);
  const fileRef                     = useRef(null);
  const coverRef                    = useRef(null);

  useEffect(() => {
    fetchMiEstado().then(setMiEstado).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    setData({
      nombre:      user.nombre      || '',
      correo:      user.correo      || '',
      telefono:    user.telefono    || '',
      descripcion: user.descripcion || '',
      ciudad:      user.ciudad      || '',
      latitud:     user.latitud  != null ? String(user.latitud)  : '',
      longitud:    user.longitud != null ? String(user.longitud) : '',
      foto_perfil:      user.foto_perfil      || '',
      foto_portada:     user.foto_portada     || '',
      foto_portada_pos: user.foto_portada_pos || '50% 50%',
    });
    if (user.latitud != null && user.longitud != null) {
      setGeoData({ lat: user.latitud, lon: user.longitud, city: user.ciudad || '' });
    }
  }, [user]);

  const loadPubs = useCallback(async () => {
    if (!user?.id) return;
    setPubsLoading(true);
    try {
      const data = await apiFetch(`/users/${user.id}/publicaciones`);
      setPubs(data.publicaciones || []);
    } catch { /* silencioso */ }
    finally { setPubsLoading(false); }
  }, [user?.id]);

  useEffect(() => { loadPubs(); }, [loadPubs]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const onPickPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      onError('La imagen debe pesar menos de 2 MB.');
      return;
    }
    const r = new FileReader();
    r.onload = () => setData((d) => ({ ...d, foto_perfil: r.result }));
    r.readAsDataURL(file);
    e.target.value = '';
  };

  const onCoverDragStart = (e) => {
    if (!adjusting) return;
    e.preventDefault();
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const [curX, curY] = (data.foto_portada_pos || '50% 50%').split(' ').map(v => parseFloat(v));
    setDragStart({ clientY, clientX, curX, curY });
  };

  const onCoverDragMove = (e) => {
    if (!dragStart || !coverDivRef.current) return;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const rect = coverDivRef.current.getBoundingClientRect();
    const deltaY = ((clientY - dragStart.clientY) / rect.height) * -100;
    const deltaX = ((clientX - dragStart.clientX) / rect.width)  * -100;
    const newY = Math.min(100, Math.max(0, dragStart.curY + deltaY));
    const newX = Math.min(100, Math.max(0, dragStart.curX + deltaX));
    setData(d => ({ ...d, foto_portada_pos: `${newX.toFixed(1)}% ${newY.toFixed(1)}%` }));
  };

  const onCoverDragEnd = () => setDragStart(null);

  const onPickCover = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      onError('La portada debe pesar menos de 4 MB.');
      return;
    }
    const r = new FileReader();
    r.onload = () => setData((d) => ({ ...d, foto_portada: r.result }));
    r.readAsDataURL(file);
    e.target.value = '';
  };

  const usarUbicacion = async () => {
    setGeoLoading(true);
    setGeoError('');
    try {
      const { lat, lon, city } = await geolocateToCity();
      setGeoData({ lat, lon, city });
      setData((prev) => ({
        ...prev,
        latitud:  String(lat),
        longitud: String(lon),
        ciudad:   city || prev.ciudad,
      }));
    } catch (e) {
      setGeoError(e.message);
    } finally {
      setGeoLoading(false);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    if (!user?.id) return;
    try {
      await updateProfile(user.id, {
        nombre:       data.nombre,
        correo:       data.correo,
        telefono:     data.telefono,
        descripcion:  data.descripcion  || null,
        foto_perfil:  data.foto_perfil  || null,
        foto_portada:     data.foto_portada     || null,
        foto_portada_pos: data.foto_portada_pos || '50% 50%',
        ciudad:       data.ciudad       || null,
        latitud:      data.latitud  !== '' ? Number(data.latitud)  : null,
        longitud:     data.longitud !== '' ? Number(data.longitud) : null,
      });
      setEditing(false);
    } catch (err) {
      onError(err.message);
    }
  };

  const esPremium = (miEstado?.plan || user?.plan) === 'premium';

  return (
    <section className="prof anunza-profile">
      {!editing ? (
        <>
          {/* ── Hero ── */}
          <div className="upp2-hero">
            <div
              className="upp2-cover"
              style={user?.foto_portada ? {
                backgroundImage: `url(${user.foto_portada})`,
                backgroundSize: 'cover',
                backgroundPosition: user.foto_portada_pos || '50% 50%',
              } : undefined}
            />
            <div className="upp2-hero-content">
              <img
                src={user?.foto_perfil || DEFAULT_AVATAR}
                alt=""
                className="upp2-avatar"
              />
              <div className="upp2-identity">
                <h1 className="upp2-name">
                  {user?.nombre}
                  {user?.verificado && (
                    <span className="upp2-verified" title="Usuario verificado">✓</span>
                  )}
                  {esPremium && (
                    <span className="prof-badge prof-badge-premium">★ Premium</span>
                  )}
                </h1>
                <div className="upp2-meta-row">
                  {user?.ciudad && <span>📍 {user.ciudad}</span>}
                  {user?.created_at && (
                    <span>Miembro desde {formatDate(user.created_at)}</span>
                  )}
                </div>
                <div className="upp2-stats-row">
                  <div className="upp2-stat">
                    <span className="upp2-stat-num">{pubs.length}</span>
                    <span className="upp2-stat-label">publicaciones</span>
                  </div>
                  <div className="upp2-stat">
                    <span className="upp2-stat-num">
                      {pubs.reduce((acc, p) => acc + (p.likes ?? 0), 0)}
                    </span>
                    <span className="upp2-stat-label">me gusta recibidos</span>
                  </div>
                </div>
              </div>
              <div className="upp2-hero-actions">
                <button
                  type="button"
                  className="upp2-btn-primary"
                  onClick={() => setEditing(true)}
                >
                  Editar perfil
                </button>
              </div>
            </div>
          </div>

          {/* ── Plan ── */}
          <div className={`prof-plan-box ${esPremium ? 'prof-plan-premium' : ''}`}>
            {esPremium ? (
              <p className="prof-plan-txt">💜 Plan <strong>Premium</strong> activo — publicaciones ilimitadas</p>
            ) : (
              <>
                <p className="prof-plan-txt">
                  Plan gratuito ·{' '}
                  {miEstado ? `${miEstado.publicaciones_activas}/${miEstado.limite} publicaciones` : '—'}
                </p>
                <button
                  type="button"
                  className="prof-plan-btn"
                  onClick={() => setShowPremiumModal(true)}
                >
                  Actualizar a Premium — $29.900/mes
                </button>
              </>
            )}
          </div>

          {/* ── Bio ── */}
          {user?.descripcion && (
            <div className="upp2-about">{user.descripcion}</div>
          )}

          {/* ── Datos de contacto ── */}
          <div className="prof-card prof-contact-card">
            <p className="prof-contact-title">Información de contacto</p>
            <div className="prof-grid">
              <p><strong>Correo:</strong> {user?.correo}</p>
              <p><strong>Teléfono:</strong> {user?.telefono}</p>
              {user?.cedula && <p><strong>Cédula:</strong> {user.cedula}</p>}
            </div>
          </div>

          {/* ── Publicaciones ── */}
          <div className="upp2-pubs-section">
            <h2 className="upp2-pubs-title">
              Publicaciones
              <span className="upp2-pubs-count">{pubs.length}</span>
            </h2>
            {pubsLoading ? (
              <p className="upp2-loading">Cargando publicaciones…</p>
            ) : pubs.length === 0 ? (
              <p className="upp2-empty">Aún no tienes publicaciones activas.</p>
            ) : (
              <div className="upp2-pubs-grid">
                {pubs.map(pub => (
                  <PubCard
                    key={pub.id}
                    pub={pub}
                    onClick={() => navigate('/dashboard', { state: { openSection: 'inicio', highlightId: pub.id } })}
                  />
                ))}
              </div>
            )}
          </div>

          {showPremiumModal && (
            <PlanPremiumModal
              onClose={() => setShowPremiumModal(false)}
              onSuccess={() => {
                setShowPremiumModal(false);
                setMiEstado((prev) => ({ ...prev, plan: 'premium', limite: null }));
              }}
            />
          )}
        </>
      ) : (
        <form className="prof-form" onSubmit={save}>
          {/* Bloque de fotos integrado */}
          <div className="prof-photos-block">
            {/* Portada */}
            <div
              ref={coverDivRef}
              className={`prof-cover-edit${adjusting ? ' is-adjusting' : ''}`}
              style={data.foto_portada ? {
                backgroundImage: `url(${data.foto_portada})`,
                backgroundSize: 'cover',
                backgroundPosition: data.foto_portada_pos || '50% 50%',
              } : undefined}
              onMouseDown={onCoverDragStart}
              onMouseMove={onCoverDragMove}
              onMouseUp={onCoverDragEnd}
              onMouseLeave={onCoverDragEnd}
              onTouchStart={onCoverDragStart}
              onTouchMove={onCoverDragMove}
              onTouchEnd={onCoverDragEnd}
            >
              {adjusting ? (
                <div className="prof-cover-adjust-overlay">
                  <span className="prof-cover-adjust-hint">Arrastra para reposicionar</span>
                  <button
                    type="button"
                    className="prof-cover-adjust-done"
                    onMouseDown={e => e.stopPropagation()}
                    onClick={() => setAdjusting(false)}
                  >
                    ✓ Listo
                  </button>
                </div>
              ) : (
                <div className="prof-cover-edit-overlay">
                  <input ref={coverRef} type="file" accept="image/*" className="prof-file" onChange={onPickCover} />
                  <button type="button" className="prof-cover-edit-btn" onClick={() => coverRef.current?.click()}>
                    📷 {data.foto_portada ? 'Cambiar' : 'Añadir portada'}
                  </button>
                  {data.foto_portada && (
                    <button
                      type="button"
                      className="prof-cover-edit-btn"
                      onClick={() => setAdjusting(true)}
                    >
                      ↕ Ajustar
                    </button>
                  )}
                  {data.foto_portada && (
                    <button
                      type="button"
                      className="prof-cover-edit-btn prof-cover-edit-btn--remove"
                      onClick={() => setData(d => ({ ...d, foto_portada: '', foto_portada_pos: '50% 50%' }))}
                    >
                      ✕ Quitar
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Avatar sobre la portada */}
            <div className="prof-avatar-edit-row">
              <div className="prof-avatar-edit-wrap">
                <img src={data.foto_perfil || DEFAULT_AVATAR} alt="" className="prof-avatar-edit-img" />
                <input ref={fileRef} type="file" accept="image/*" className="prof-file" onChange={onPickPhoto} />
                <button
                  type="button"
                  className="prof-avatar-edit-btn"
                  onClick={() => fileRef.current?.click()}
                  title="Cambiar foto de perfil"
                >
                  📷
                </button>
              </div>
            </div>
          </div>

          <label className="prof-label">
            Nombre
            <input name="nombre" value={data.nombre} onChange={handleChange} required />
          </label>
          <label className="prof-label">
            Correo
            <input name="correo" type="email" value={data.correo} onChange={handleChange} required />
          </label>
          <label className="prof-label">
            Teléfono
            <input name="telefono" type="tel" value={data.telefono} onChange={handleChange} required />
          </label>

          <div className="prof-label">
            <span className="prof-label-text">Ciudad / ubicación</span>
            <input
              name="ciudad"
              value={data.ciudad}
              onChange={handleChange}
              placeholder="Ej. Medellín"
            />
            <button
              type="button"
              className="prof-geo-btn"
              onClick={usarUbicacion}
              disabled={geoLoading}
            >
              {geoLoading ? '⏳ Detectando…' : '📍 Usar mi ubicación'}
            </button>
            {geoError && <p className="prof-geo-error">{geoError}</p>}
            {geoData && !geoError && (
              <>
                <p className="prof-geo-ok">
                  ✓ Ubicación detectada{geoData.city ? `: ${geoData.city}` : ''}
                  {geoData.source === 'ip' ? ' (aproximada por IP)' : ''}
                </p>
                <div className="prof-map-wrap">
                  <iframe
                    title="Mapa de ubicación"
                    src={osmEmbedUrl(geoData.lat, geoData.lon)}
                    className="prof-map"
                  />
                </div>
              </>
            )}
          </div>

          <label className="prof-label">
            Descripción / bio
            <textarea
              name="descripcion"
              rows={4}
              value={data.descripcion}
              onChange={handleChange}
              placeholder="Cuéntale a la comunidad sobre ti…"
            />
          </label>

          <div className="prof-actions">
            <button type="submit" className="prof-save">Guardar</button>
            <button type="button" className="prof-cancel" onClick={() => setEditing(false)}>Cancelar</button>
          </div>
        </form>
      )}
    </section>
  );
}
