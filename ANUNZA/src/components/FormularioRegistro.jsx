import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { geolocateToCity, osmEmbedUrl } from '../utils/geolocate';
import { PoliticaDatosModal } from './PoliticaDatosModal';
import { IconLoader, IconMapPin, IconCheck, IconX } from './icons';
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
  const [geoData, setGeoData]   = useState(null);
  const [aceptaDatos, setAceptaDatos] = useState(false);
  const [showPolitica, setShowPolitica] = useState(false);
  const [correoEnviado, setCorreoEnviado] = useState('');

  const pwdRules = [
    { label: 'Mínimo 8 caracteres',           test: (p) => p.length >= 8 },
    { label: 'Al menos una mayúscula',         test: (p) => /[A-Z]/.test(p) },
    { label: 'Al menos una minúscula',         test: (p) => /[a-z]/.test(p) },
    { label: 'Al menos un número',             test: (p) => /\d/.test(p) },
    { label: 'Al menos un carácter especial',  test: (p) => /[!@#$%^&*(),.?":{}|<>\-_=+\[\]\\;'/`~]/.test(p) },
  ];

  const pwdScore = pwdRules.filter((r) => r.test(formData.password)).length;
  const pwdStrength = pwdScore <= 1 ? 'débil' : pwdScore <= 3 ? 'regular' : pwdScore === 4 ? 'buena' : 'fuerte';

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
      if (!aceptaDatos) {
        setError('Debes aceptar la Política de Tratamiento de Datos Personales.');
        setLoading(false); return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Las contraseñas no coinciden');
        setLoading(false); return;
      }
      const failedRules = pwdRules.filter((r) => !r.test(formData.password));
      if (failedRules.length > 0) {
        setError(`Contraseña insegura: ${failedRules[0].label.toLowerCase()}.`);
        setLoading(false); return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.correo)) {
        setError('Correo inválido');
        setLoading(false); return;
      }
      const data = await register(
        formData.nombre, formData.correo, formData.telefono, formData.password,
        formData.cedula, formData.ciudad,
        formData.latitud  !== '' ? Number(formData.latitud)  : null,
        formData.longitud !== '' ? Number(formData.longitud) : null
      );
      if (data?.needs_confirmation) {
        setCorreoEnviado(formData.correo.trim().toLowerCase());
        return;
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (correoEnviado) {
    return (
      <div className="auth-container">
        <div className="auth-panel-form" style={{ width: '100%' }}>
          <div className="auth-box" style={{ maxWidth: 480, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>
              <IconCheck size={48} style={{ color: '#4f46e5' }} />
            </div>
            <h1 style={{ fontSize: '1.5rem', marginBottom: 8 }}>Revisa tu correo</h1>
            <p style={{ color: '#6b7280', marginBottom: 20, lineHeight: 1.6 }}>
              Enviamos un enlace de confirmación a{' '}
              <strong style={{ color: '#1e1b4b' }}>{correoEnviado}</strong>.
              Haz clic en el enlace del correo para activar tu cuenta.
            </p>
            <p style={{ fontSize: '0.82rem', color: '#9ca3af', marginBottom: 24 }}>
              ¿No te llegó? Revisa la carpeta de spam o{' '}
              <button
                type="button"
                className="auth-politica-link"
                onClick={async () => {
                  try {
                    const { API_URL } = await import('../services/api');
                    await fetch(`${API_URL}/auth/reenviar-confirmacion`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ correo: correoEnviado }),
                    });
                    setError('');
                  } catch { /* silencio */ }
                }}
              >
                reenvía el correo
              </button>
              .
            </p>
            <Link to="/login" className="submit-button" style={{ display: 'inline-block', textDecoration: 'none' }}>
              Ir al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
                {geoLoading ? <><IconLoader size={14}/> Detectando…</> : <><IconMapPin size={14}/> Usar mi ubicación</>}
              </button>

              {geoData && (
                <>
                  <p className="geo-hint geo-hint--ok">
                    <><IconCheck size={14}/> Ubicación detectada{geoData.city ? `: ${geoData.city}` : ''}</>
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

            {/* Contraseña con medidor */}
            <div className="form-group form-group--full">
              <label htmlFor="password">Contraseña</label>
              <input type="password" id="password" name="password"
                value={formData.password} onChange={handleChange}
                placeholder="Mínimo 8 caracteres" required />

              {formData.password.length > 0 && (
                <>
                  <div className="pwd-meter">
                    {[1,2,3,4,5].map((i) => (
                      <span key={i} className={`pwd-meter-bar pwd-meter-bar--${pwdStrength}${i <= pwdScore ? ' filled' : ''}`} />
                    ))}
                    <span className={`pwd-meter-label pwd-meter-label--${pwdStrength}`}>{pwdStrength}</span>
                  </div>
                  <ul className="pwd-rules">
                    {pwdRules.map((r) => (
                      <li key={r.label} className={r.test(formData.password) ? 'ok' : 'fail'}>
                        {r.test(formData.password) ? <IconCheck size={12}/> : <IconX size={12}/>} {r.label}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            <div className="form-group form-group--full">
              <label htmlFor="confirmPassword">Confirmar contraseña</label>
              <input type="password" id="confirmPassword" name="confirmPassword"
                value={formData.confirmPassword} onChange={handleChange}
                placeholder="••••••••" required />
              {formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword && (
                <p className="pwd-no-match">Las contraseñas no coinciden</p>
              )}
            </div>

            <div className="form-group--full auth-politica-row">
              <input
                type="checkbox"
                id="aceptaDatos"
                checked={aceptaDatos}
                onChange={(e) => setAceptaDatos(e.target.checked)}
              />
              <label htmlFor="aceptaDatos" style={{ cursor: 'pointer', margin: 0 }}>
                He leído y acepto la{' '}
                <button
                  type="button"
                  className="auth-politica-link"
                  onClick={() => setShowPolitica(true)}
                >
                  Política de Tratamiento de Datos Personales
                </button>
                . Declaro ser mayor de 18 años.
              </label>
            </div>

            <button type="submit" className="submit-button form-group--full" disabled={loading || !aceptaDatos}>
              {loading ? 'Registrando…' : 'Crear cuenta →'}
            </button>
          </form>

          <p className="auth-footer">
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión aquí</Link>
          </p>
        </div>
      </div>

      {showPolitica && <PoliticaDatosModal onClose={() => setShowPolitica(false)} />}
    </div>
  );
};
