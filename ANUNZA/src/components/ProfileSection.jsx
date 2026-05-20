import React, { useEffect, useState, useRef } from 'react';
import { apiFetch } from '../services/api';
import './ProfileSection.css';

export function ProfileSection({ user, updateProfile, onError, isOwnProfile = true }) {
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
  const [openReport, setOpenReport] = useState(false);
  const [reportMotivo, setReportMotivo] = useState('Contenido inapropiado');
  const [reportDetalles, setReportDetalles] = useState('');

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

  const sendReporte = async () => {
    if (!reportMotivo || !user?.id) return;
    try {
      await apiFetch('/reportes', {
        method: 'POST',
        body: JSON.stringify({ tipo: 'usuario', objeto_id: user.id, motivo: reportMotivo, detalles: reportDetalles }),
      });
      setOpenReport(false);
      setReportDetalles('');
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
              src={
                user?.foto_perfil ||
                'https://api.dicebear.com/7.x/avataaars/svg?seed=profile'
              }
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
          {!isOwnProfile && (
            <button
              type="button"
              className="prof-edit-btn"
              style={{ marginTop: '0.5rem', background: '#fde8e8', color: '#9b1c1c', border: '1px solid #f5c6c6' }}
              onClick={() => setOpenReport((v) => !v)}
            >
              Reportar usuario
            </button>
          )}
          {!isOwnProfile && openReport && (
            <div className="pub-panel pub-panel-reveal" style={{ marginTop: '0.75rem' }}>
              <p className="pub-panel-title">Reportar usuario</p>
              <select
                value={reportMotivo}
                onChange={(e) => setReportMotivo(e.target.value)}
                style={{ width: '100%', marginBottom: '0.5rem', borderRadius: '8px', border: '1px solid #ddd', padding: '0.45rem 0.6rem', fontFamily: 'inherit' }}
              >
                <option>Contenido inapropiado</option>
                <option>Spam o publicidad</option>
                <option>Información falsa</option>
                <option>Acoso o amenazas</option>
                <option>Otro</option>
              </select>
              <textarea
                rows={2}
                placeholder="Detalles adicionales (opcional)…"
                value={reportDetalles}
                onChange={(e) => setReportDetalles(e.target.value)}
                style={{ width: '100%', borderRadius: '8px', border: '1px solid #ddd', padding: '0.5rem', marginBottom: '0.5rem', fontFamily: 'inherit' }}
              />
              <button type="button" className="pub-send" onClick={sendReporte}>
                Enviar reporte
              </button>
            </div>
          )}
        </div>
      ) : (
        <form className="prof-form" onSubmit={save}>
          <div className="prof-photo-row">
            <img
              src={
                data.foto_perfil ||
                'https://api.dicebear.com/7.x/avataaars/svg?seed=edit'
              }
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
