import React, { useEffect, useState, useRef } from 'react';
import { PlanPremiumModal } from './PlanPremiumModal';
import { fetchMiEstado } from '../models/pagosModel';
import { geolocateToCity, osmEmbedUrl } from '../utils/geolocate';
import { DEFAULT_AVATAR } from '../utils/constants';
import './ProfileSection.css';

export function ProfileSection({ user, updateProfile, onError }) {
  const [editing, setEditing]             = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [miEstado, setMiEstado]           = useState(null);
  const [geoLoading, setGeoLoading]       = useState(false);
  const [geoData, setGeoData]             = useState(null); // { lat, lon, city }
  const [geoError, setGeoError]           = useState('');
  const [data, setData] = useState({
    nombre:     '',
    correo:     '',
    telefono:   '',
    descripcion:'',
    ciudad:     '',
    latitud:    '',
    longitud:   '',
    foto_perfil:'',
  });
  const fileRef = useRef(null);

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
      foto_perfil: user.foto_perfil || '',
    });
    // Si el usuario ya tiene coordenadas guardadas, mostrar el mapa
    if (user.latitud != null && user.longitud != null) {
      setGeoData({ lat: user.latitud, lon: user.longitud, city: user.ciudad || '' });
    }
  }, [user]);

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
        nombre:      data.nombre,
        correo:      data.correo,
        telefono:    data.telefono,
        descripcion: data.descripcion || null,
        foto_perfil: data.foto_perfil || null,
        ciudad:      data.ciudad || null,
        latitud:     data.latitud  !== '' ? Number(data.latitud)  : null,
        longitud:    data.longitud !== '' ? Number(data.longitud) : null,
      });
      setEditing(false);
    } catch (err) {
      onError(err.message);
    }
  };

  return (
    <section className="prof anunza-profile">
      <h2>Mi perfil</h2>
      {!editing ? (
        <>
        <div className="prof-card">
          <div className="prof-head">
            <img
              src={user?.foto_perfil || DEFAULT_AVATAR}
              alt=""
              className="prof-avatar"
            />
            <div>
              <p className="prof-name">
                {user?.nombre}
                {user?.verificado && (
                  <span className="prof-badge prof-badge-verificado" title="Usuario verificado">✓ Verificado</span>
                )}
                {(miEstado?.plan || user?.plan) === 'premium' && (
                  <span className="prof-badge prof-badge-premium">★ Premium</span>
                )}
              </p>
              {user?.ciudad && <p className="prof-meta">📍 {user.ciudad}</p>}
            </div>
          </div>

          <div className={`prof-plan-box ${(miEstado?.plan || user?.plan) === 'premium' ? 'prof-plan-premium' : ''}`}>
            {(miEstado?.plan || user?.plan) === 'premium' ? (
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

          {user?.descripcion && <p className="prof-bio">{user.descripcion}</p>}
          <div className="prof-grid">
            <p><strong>Correo:</strong> {user?.correo}</p>
            <p><strong>Teléfono:</strong> {user?.telefono}</p>
            {user?.cedula && <p><strong>Cédula:</strong> {user.cedula}</p>}
          </div>
          <button type="button" className="prof-edit-btn" onClick={() => setEditing(true)}>
            Editar perfil
          </button>
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
          <div className="prof-photo-row">
            <img src={data.foto_perfil || DEFAULT_AVATAR} alt="" className="prof-avatar-lg" />
            <div>
              <input ref={fileRef} type="file" accept="image/*" className="prof-file" onChange={onPickPhoto} />
              <button type="button" className="prof-photo-btn" onClick={() => fileRef.current?.click()}>
                Cambiar foto de perfil
              </button>
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

          {/* Ubicación con mapa */}
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
