import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthForm.css';

/**
 * FormularioRegistro - Componente para registro de nuevos usuarios
 */
export const FormularioRegistro = () => {
  const navigate = useNavigate();
  const { register, error: authError } = useAuth();
  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    telefono: '',
    cedula: '',
    ciudad: '',
    latitud: '',
    longitud: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const usarUbicacion = () => {
    if (!navigator.geolocation) {
      setError('Tu navegador no permite geolocalización.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          latitud: String(pos.coords.latitude),
          longitud: String(pos.coords.longitude),
        }));
        setError('');
      },
      () => setError('No se pudo obtener la ubicación. Puedes escribir la ciudad manualmente.')
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validar campos
      if (
        !formData.nombre ||
        !formData.correo ||
        !formData.telefono ||
        !formData.cedula ||
        !formData.ciudad ||
        !formData.password
      ) {
        setError('Por favor completa todos los campos (incluye ciudad)');
        setLoading(false);
        return;
      }

      // Validar que las contraseñas coincidan
      if (formData.password !== formData.confirmPassword) {
        setError('Las contraseñas no coinciden');
        setLoading(false);
        return;
      }

      // Validar longitud de contraseña
      if (formData.password.length < 6) {
        setError('La contraseña debe tener mínimo 6 caracteres');
        setLoading(false);
        return;
      }

      // Validar formato de correo
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.correo)) {
        setError('Correo inválido');
        setLoading(false);
        return;
      }

      // Llamar función de registro
      await register(
        formData.nombre,
        formData.correo,
        formData.telefono,
        formData.password,
        formData.cedula,
        formData.ciudad,
        formData.latitud !== '' ? Number(formData.latitud) : null,
        formData.longitud !== '' ? Number(formData.longitud) : null
      );

      // Redirigir al dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>Crear Cuenta</h1>

        {(error || authError) && <div className="error-message">{error || authError}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="nombre">Nombre Completo</label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Juan Pérez"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="correo">Correo Electrónico</label>
            <input
              type="email"
              id="correo"
              name="correo"
              value={formData.correo}
              onChange={handleChange}
              placeholder="ejemplo@correo.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="telefono">Teléfono</label>
            <input
              type="tel"
              id="telefono"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              placeholder="+57 300 000 0000"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="cedula">Cédula</label>
            <input
              type="text"
              id="cedula"
              name="cedula"
              value={formData.cedula}
              onChange={handleChange}
              placeholder="Documento de identidad"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="ciudad">Ciudad / ubicación</label>
            <input
              type="text"
              id="ciudad"
              name="ciudad"
              value={formData.ciudad}
              onChange={handleChange}
              placeholder="Ej. Medellín"
              required
            />
            <button type="button" className="geo-btn" onClick={usarUbicacion}>
              Obtener coordenadas (opcional)
            </button>
            {(formData.latitud || formData.longitud) && (
              <p className="geo-hint">
                Coordenadas guardadas para “cerca de mí”. Lat: {formData.latitud} · Lng:{' '}
                {formData.longitud}
              </p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar Contraseña</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>

        <p className="auth-footer">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión aquí</Link>
        </p>
      </div>
    </div>
  );
};
