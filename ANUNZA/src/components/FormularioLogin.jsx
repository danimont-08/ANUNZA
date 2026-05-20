import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthForm.css';

export const FormularioLogin = () => {
  const navigate = useNavigate();
  const { login, error: authError } = useAuth();
  const [formData, setFormData] = useState({ correo: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (!formData.correo || !formData.password) {
        setError('Por favor completa todos los campos');
        setLoading(false);
        return;
      }
      const data = await login(formData.correo, formData.password);
      if (data.user?.rol === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Panel izquierdo — branding */}
      <div className="auth-panel-brand">
        <span className="auth-brand-circle" />
        <span className="auth-brand-circle" />
        <span className="auth-brand-circle" />
        <div className="auth-brand-content">
          <div className="auth-brand-logo">ANUN<span>ZA</span></div>
          <p className="auth-brand-slogan">Tu talento importa</p>
          <div className="auth-brand-dots">
            <span /><span /><span /><span />
          </div>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="auth-panel-form">
        <div className="auth-box">
          {/* Logo + eslogan solo en mobile */}
          <div className="auth-logo-mobile">ANUN<span>ZA</span></div>
          <span className="auth-logo-mobile-slogan">Tu talento importa</span>

          <h1>Bienvenido</h1>
          <p className="auth-box-subtitle">Inicia sesión para continuar</p>

          {(error || authError) && (
            <div className="error-message">{error || authError}</div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="correo">Correo electrónico</label>
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

            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? 'Iniciando sesión…' : 'Iniciar sesión →'}
            </button>
          </form>

          <p className="auth-footer">
            ¿No tienes cuenta? <Link to="/register">Regístrate gratis</Link>
          </p>
        </div>
      </div>
    </div>
  );
};