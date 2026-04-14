import React, { useEffect, useState, useRef } from 'react';
import './ProfileSection.css';

// Avatar por defecto: silueta de persona (SVG inline, sin dependencia externa)
const DEFAULT_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23b0aac8'%3E%3Ccircle cx='12' cy='8' r='4'/%3E%3Cpath d='M4 20c0-4 3.6-7 8-7s8 3 8 7'/%3E%3C/svg%3E";

export function ProfileSection({ user, updateProfile, onError }) {
  const [editing, setEditing] = useState(false);
  const [data, setData] = useState({
    nombre: '',
    correo: '',
    telefono: '',
    descripcion: '',
    ciudad: '',
    codigo_postal: '',
    latitud: '',
    longitud: '',
    foto_perfil: '',
  });
  const fileRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    setData({
      nombre: user.nombre || '',
      correo: user.correo || '',
      telefono: user.telefono || '',
      descripcion: user.descripcion || '',
      ciudad: user.ciudad || '',
      codigo_postal: user.codigo_postal || '',
      latitud: user.latitud != null ? String(user.latitud) : '',
      longitud: user.longitud != null ? String(user.longitud) : '',
      foto_perfil: user.foto_perfil || '',
    });
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
    r.onload = () => {
      setData((d) => ({ ...d, foto_perfil: r.result }));
    };
    r.readAsDataURL(file);
    e.target.value = '';
  };

  const save = async (e) => {
    e.preventDefault();
    if (!user?.id) return;
    try {
      await updateProfile(user.id, {
        nombre: data.nombre,
        correo: data.correo,
        telefono: data.telefono,
        descripcion: data.descripcion || null,
        foto_perfil: data.foto_perfil || null,
        ciudad: data.ciudad || null,
        codigo_postal: data.codigo_postal || null,
        latitud: data.latitud !== '' ? Number(data.latitud) : null,
        longitud: data.longitud !== '' ? Number(data.longitud) : null,
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
        <div className="prof-card">
          <div className="prof-head">
            <img
              src={user?.foto_perfil || DEFAULT_AVATAR}
              alt=""
              className="prof-avatar"
            />
            <div>
              <p className="prof-name">{user?.nombre}</p>
              {user?.ciudad && <p className="prof-meta">📍 {user.ciudad}</p>}
            </div>
          </div>
          {user?.descripcion && <p className="prof-bio">{user.descripcion}</p>}
          <div className="prof-grid">
            <p>
              <strong>Correo:</strong> {user?.correo}
            </p>
            <p>
              <strong>Teléfono:</strong> {user?.telefono}
            </p>
            {user?.cedula && (
              <p>
                <strong>Cédula:</strong> {user.cedula}
              </p>
            )}
          </div>
          <button type="button" className="prof-edit-btn" onClick={() => setEditing(true)}>
            Editar perfil
          </button>
        </div>
      ) : (
        <form className="prof-form" onSubmit={save}>
          <div className="prof-photo-row">
            <img
              src={data.foto_perfil || DEFAULT_AVATAR}
              alt=""
              className="prof-avatar-lg"
            />
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
          <label className="prof-label">
            Ciudad
            <input name="ciudad" value={data.ciudad} onChange={handleChange} placeholder="Para filtros &quot;cerca de mí&quot;" />
          </label>
          <label className="prof-label">
            Código postal
            <input name="codigo_postal" value={data.codigo_postal} onChange={handleChange} />
          </label>
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
          <label className="prof-label">
            Latitud (opcional)
            <input name="latitud" value={data.latitud} onChange={handleChange} />
          </label>
          <label className="prof-label">
            Longitud (opcional)
            <input name="longitud" value={data.longitud} onChange={handleChange} />
          </label>
          <div className="prof-actions">
            <button type="submit" className="prof-save">
              Guardar
            </button>
            <button type="button" className="prof-cancel" onClick={() => setEditing(false)}>
              Cancelar
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
