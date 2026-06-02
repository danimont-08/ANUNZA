import React, { useEffect, useState, useRef, useCallback } from 'react';
import { PlanPremiumModal } from './PlanPremiumModal';
import { ConfirmDialog } from './ConfirmDialog';
import { EditPublicacionModal } from './feed/EditPublicacionModal';
import { fetchMiEstado } from '../models/pagosModel';
import { deletePublicacion } from '../models/publicacionModel';
import { apiFetch } from '../services/api';
import { geolocateToCity, osmEmbedUrl } from '../utils/geolocate';
import { compressImage } from '../utils/imageCompression';
import { DEFAULT_AVATAR } from '../utils/constants';
import { formatDate, formatCOP } from '../utils/format';
import {
  IconShieldCheck, IconCrown, IconMapPin, IconCamera,
  IconArrowsUpDown, IconX, IconLoader, IconCheck,
  IconHeart, IconChat, IconDots, IconTrash, IconSun, IconMoon,
} from './icons';
import './ProfileSection.css';
import '../pages/UserPublicProfile.css';

function PubCard({ pub, onClick, onDelete, onEdit }) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!showMenu) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  return (
    <article className="upp2-pub-card">
      <div onClick={onClick} style={{ cursor: 'pointer' }}>
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
            <span><IconHeart size={13} /> {pub.likes ?? 0}</span>
            <span><IconChat size={13} /> {pub.comentarios_count ?? 0}</span>
          </div>
          <p className="upp2-pub-date">{formatDate(pub.created_at)}</p>
        </div>
      </div>

      <div className="upp2-pub-menu-wrapper" ref={menuRef}>
        <button
          type="button"
          className="upp2-pub-menu-btn"
          onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
          title="Opciones"
        >
          <IconDots size={16} />
        </button>
        {showMenu && (
          <div className="upp2-pub-menu">
            {onEdit && (
              <button
                type="button"
                className="upp2-pub-menu-item"
                onClick={(e) => { e.stopPropagation(); onEdit(pub); setShowMenu(false); }}
              >
                <IconCheck size={15} /> Editar
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                className="upp2-pub-menu-item upp2-pub-menu-item--danger"
                onClick={(e) => { e.stopPropagation(); onDelete(pub); setShowMenu(false); }}
              >
                <IconTrash size={15} /> Eliminar
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

export function ProfileSection({ user, updateProfile, onError, onNavigateToPost, dark, onToggleTheme, onLogout }) {
  const [editing, setEditing]               = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [miEstado, setMiEstado]             = useState(null);
  const [pubs, setPubs]                     = useState([]);
  const [pubsLoading, setPubsLoading]       = useState(false);
  const [pubToDelete, setPubToDelete]       = useState(null);
  const [pubToEdit, setPubToEdit]           = useState(null);
  const [deleting, setDeleting]             = useState(false);
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

  const onPickPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    try {
      const compressed = await compressImage(file, { maxWidth: 400, maxHeight: 400, quality: 0.88 });
      setData((d) => ({ ...d, foto_perfil: compressed }));
    } catch {
      onError('No se pudo procesar la imagen.');
    }
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

  const onPickCover = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    try {
      const compressed = await compressImage(file, { maxWidth: 1600, maxHeight: 600, quality: 0.85 });
      setData((d) => ({ ...d, foto_portada: compressed }));
    } catch {
      onError('No se pudo procesar la portada.');
    }
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

  const handleConfirmDelete = async () => {
    if (!pubToDelete) return;
    setDeleting(true);
    try {
      await deletePublicacion(pubToDelete.id);
      setPubs((prev) => prev.filter((p) => p.id !== pubToDelete.id));
      fetchMiEstado().then(setMiEstado).catch(() => {});
    } catch (e) {
      onError(e.message);
    } finally {
      setDeleting(false);
      setPubToDelete(null);
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
                    <span className="upp2-verified" title="Usuario verificado"><IconShieldCheck size={14}/></span>
                  )}
                  {esPremium && (
                    <span className="prof-badge prof-badge-premium"><IconCrown size={12}/> Premium</span>
                  )}
                </h1>
                {!user?.verificado && (
                  <p className="prof-verificacion-hint">
                    <IconShieldCheck size={13}/> No verificado · Contacta al soporte para verificar tu cuenta
                  </p>
                )}
                <div className="upp2-meta-row">
                  {user?.ciudad && <span><IconMapPin size={14}/> {user.ciudad}</span>}
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
              <p className="prof-plan-txt"><IconCrown size={14}/> Plan <strong>Premium</strong> activo — publicaciones ilimitadas</p>
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
                    onClick={() => onNavigateToPost?.(pub.id)}
                    onDelete={(p) => setPubToDelete(p)}
                    onEdit={(p) => setPubToEdit(p)}
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

          {pubToDelete && (
            <ConfirmDialog
              message={`¿Eliminar "${pubToDelete.titulo}"? Esta acción no se puede deshacer.`}
              confirmLabel={deleting ? 'Eliminando…' : 'Eliminar'}
              danger
              onConfirm={handleConfirmDelete}
              onCancel={() => setPubToDelete(null)}
            />
          )}

          {pubToEdit && (
            <EditPublicacionModal
              pub={pubToEdit}
              onClose={() => setPubToEdit(null)}
              onUpdated={() => {
                setPubToEdit(null);
                loadPubs();
              }}
            />
          )}

          {/* Ajustes rápidos — visibles solo en móvil (el sidebar no los muestra) */}
          {(onToggleTheme || onLogout) && (
            <div className="prof-mobile-settings">
              {onToggleTheme && (
                <button type="button" className="prof-settings-btn" onClick={onToggleTheme}>
                  {dark ? <IconSun size={16} /> : <IconMoon size={16} />}
                  {dark ? 'Modo claro' : 'Modo oscuro'}
                </button>
              )}
              {onLogout && (
                <button type="button" className="prof-settings-btn prof-settings-btn--logout" onClick={onLogout}>
                  Cerrar sesión
                </button>
              )}
            </div>
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
                    <IconCheck size={14}/> Listo
                  </button>
                </div>
              ) : (
                <div className="prof-cover-edit-overlay">
                  <input ref={coverRef} type="file" accept="image/*" className="prof-file" onChange={onPickCover} />
                  <button type="button" className="prof-cover-edit-btn" onClick={() => coverRef.current?.click()}>
                    <><IconCamera size={14}/> {data.foto_portada ? 'Cambiar' : 'Añadir portada'}</>
                  </button>
                  {data.foto_portada && (
                    <button
                      type="button"
                      className="prof-cover-edit-btn"
                      onClick={() => setAdjusting(true)}
                    >
                      <><IconArrowsUpDown size={14}/> Ajustar</>
                    </button>
                  )}
                  {data.foto_portada && (
                    <button
                      type="button"
                      className="prof-cover-edit-btn prof-cover-edit-btn--remove"
                      onClick={() => setData(d => ({ ...d, foto_portada: '', foto_portada_pos: '50% 50%' }))}
                    >
                      <><IconX size={14}/> Quitar</>
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
                  <IconCamera size={18}/>
                </button>
              </div>
              {data.foto_perfil && (
                <button
                  type="button"
                  className="prof-avatar-remove-btn"
                  onClick={() => setData((d) => ({ ...d, foto_perfil: '' }))}
                  title="Quitar foto de perfil"
                >
                  <IconX size={13} /> Quitar foto
                </button>
              )}
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
              {geoLoading ? <><IconLoader size={14}/> Detectando…</> : <><IconMapPin size={14}/> Usar mi ubicación</>}
            </button>
            {geoError && <p className="prof-geo-error">{geoError}</p>}
            {geoData && !geoError && (
              <>
                <p className="prof-geo-ok">
                  <><IconCheck size={14}/> Ubicación detectada{geoData.city ? `: ${geoData.city}` : ''}</>
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
