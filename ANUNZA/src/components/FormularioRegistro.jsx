import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { geolocateToCity, osmEmbedUrl } from '../utils/geolocate';
import './AuthForm.css';

export const FormularioRegistro = () => {
  const navigate = useNavigate();
  const { register, error: authError } = useAuth();

  const [formData, setFormData] = useState({
    nombre: '', correo: '', telefono: '', cedula: '',
    ciudad: '', latitud: '', longitud: '', password: '', confirmPassword: '',
  });
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoData, setGeoData]   = useState(null); // { lat, lon, city }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const usarUbicacion = async () => {
    setGeoLoading(true);
    setError('');
    try {
      const { lat, lon, city } = await geolocateToCity();
      setGeoData({ lat, lon, city });
      setFormData((prev) => ({
        ...prev,
        latitud:  String(lat),
        longitud: String(lon),
        ciudad:   city || prev.ciudad,
      }));
    } catch (e) {
      setError(e.message);
    } finally {
      setGeoLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (!formData.nombre || !formData.correo || !formData.telefono ||
          !formData.cedula || !formData.ciudad || !formData.password) {
        setError('Por favor completa todos los campos (incluye ciudad)');
        setLoading(false); return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Las contraseñas no coinciden');
        setLoading(false); return;
      }
      if (formData.password.length < 6) {
        setError('La contraseña debe tener mínimo 6 caracteres');
        setLoading(false); return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.correo)) {
        setError('Correo inválido');
        setLoading(false); return;
      }
      await register(
        formData.nombre, formData.correo, formData.telefono, formData.password,
        formData.cedula, formData.ciudad,
        formData.latitud  !== '' ? Number(formData.latitud)  : null,
        formData.longitud !== '' ? Number(formData.longitud) : null
      );
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container auth-container--register">
      {/* Panel izquierdo — branding */}
      <div className="auth-panel-brand">
        <span className="auth-brand-circle" />
        <span className="auth-brand-circle" />
        <span className="auth-brand-circle" />
        <div className="auth-brand-content">
          <div className="auth-brand-logo">ANUN<span>ZA</span></div>
          <p className="auth-brand-slogan">Tu talento importa</p>
          <p className="auth-brand-tagline">
            Crea tu cuenta y empieza a conectar con personas y servicios cerca de ti.
          </p>
          <div className="auth-brand-dots">
            <span /><span /><span /><span />
          </div>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="auth-panel-form auth-panel-form--register">
        <div className="auth-box auth-box--register">

          <div className="auth-logo-mobile">ANUN<span>ZA</span></div>
          <span className="auth-logo-mobile-slogan">Tu talento importa</span>

          <h1>Crear cuenta</h1>
          <p className="auth-box-subtitle">Completa tus datos para registrarte</p>

          {(error || authError) && (
            <div className="error-message">{error || authError}</div>
          )}

          <form onSubmit={handleSubmit} className="auth-form auth-form--grid">

            {/* Fila 1 */}
            <div className="form-group">
              <label htmlFor="nombre">Nombre completo</label>
              <input type="text" id="nombre" name="nombre"
                value={formData.nombre} onChange={handleChange}
                placeholder="Juan Pérez" required />
            </div>

            <div className="form-group">
              <label htmlFor="correo">Correo electrónico</label>
              <input type="email" id="correo" name="correo"
                value={formData.correo} onChange={handleChange}
                placeholder="ejemplo@correo.com" required />
            </div>

            {/* Fila 2 */}
            <div className="form-group">
              <label htmlFor="telefono">Teléfono</label>
              <input type="tel" id="telefono" name="telefono"
                value={formData.telefono} onChange={handleChange}
                placeholder="+57 300 000 0000" required />
            </div>

            <div className="form-group">
              <label htmlFor="cedula">Cédula</label>
              <input type="text" id="cedula" name="cedula"
                value={formData.cedula} onChange={handleChange}
                placeholder="Documento de identidad" required />
            </div>

            {/* Ubicación — ancho completo */}
            <div className="form-group form-group--full">
              <label htmlFor="ciudad">Ciudad / ubicación</label>
              <input type="text" id="ciudad" name="ciudad"
                value={formData.ciudad} onChange={handleChange}
                placeholder="Ej. Medellín" required />

              <button
                type="button"
                className="geo-btn"
                onClick={usarUbicacion}
                disabled={geoLoading}
              >
                {geoLoading ? '⏳ Detectando…' : '📍 Usar mi ubicación'}
              </button>

              {geoData && (
                <>
                  <p className="geo-hint geo-hint--ok">
                    ✓ Ubicación detectada{geoData.city ? `: ${geoData.city}` : ''}
                    {geoData.source === 'ip' ? ' (aproximada por IP)' : ''}
                  </p>
                  <div className="geo-map-wrap">
                    <iframe
                      title="Mapa de ubicación"
                      src={osmEmbedUrl(geoData.lat, geoData.lon)}
                      className="geo-map"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Fila 3 */}
            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <input type="password" id="password" name="password"
                value={formData.password} onChange={handleChange}
                placeholder="Mínimo 6 caracteres" required />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmar contraseña</label>
              <input type="password" id="confirmPassword" name="confirmPassword"
                value={formData.confirmPassword} onChange={handleChange}
                placeholder="••••••••" required />
            </div>

            <button type="submit" className="submit-button form-group--full" disabled={loading}>
              {loading ? 'Registrando…' : 'Crear cuenta →'}
            </button>
          </form>

          <p className="auth-footer">
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión aquí</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
