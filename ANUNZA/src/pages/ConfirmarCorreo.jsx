import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { API_URL } from '../services/api';
import { IconCheck, IconX, IconLoader } from '../components/icons';

export function ConfirmarCorreo() {
  const [params] = useSearchParams();
  const token = params.get('token');

  const [status, setStatus] = useState('loading'); // loading | ok | error | expired
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('El enlace no es válido.');
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${API_URL}/auth/confirmar-correo?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (res.ok && data.ok) {
          setStatus('ok');
          setMessage(data.message || '¡Correo confirmado!');
        } else if (data.expired) {
          setStatus('expired');
          setMessage(data.message || 'El enlace ha expirado.');
        } else {
          setStatus('error');
          setMessage(data.message || 'El enlace no es válido.');
        }
      } catch {
        setStatus('error');
        setMessage('No se pudo conectar con el servidor.');
      }
    })();
  }, [token]);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f5f2ff', fontFamily: 'sans-serif', padding: '1rem',
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: '3rem 2.5rem',
        maxWidth: 440, width: '100%', textAlign: 'center',
        boxShadow: '0 8px 40px rgba(79,70,229,.12)',
      }}>
        <div style={{ marginBottom: 8, fontSize: 32, fontWeight: 900, color: '#1e1b4b', letterSpacing: 1 }}>
          ANUN<span style={{ color: '#8b5cf6' }}>ZA</span>
        </div>

        {status === 'loading' && (
          <>
            <div style={{ margin: '24px auto', color: '#4f46e5' }}>
              <IconLoader size={48} />
            </div>
            <p style={{ color: '#6b7280' }}>Verificando tu correo…</p>
          </>
        )}

        {status === 'ok' && (
          <>
            <div style={{ margin: '24px auto', color: '#22c55e' }}>
              <IconCheck size={52} />
            </div>
            <h2 style={{ fontSize: '1.4rem', marginBottom: 8, color: '#1e1b4b' }}>¡Correo confirmado!</h2>
            <p style={{ color: '#6b7280', marginBottom: 28, lineHeight: 1.6 }}>{message}</p>
            <Link
              to="/login"
              style={{
                background: '#4f46e5', color: '#fff', textDecoration: 'none',
                padding: '12px 32px', borderRadius: 8, fontWeight: 700, fontSize: '0.95rem',
                display: 'inline-block',
              }}
            >
              Iniciar sesión
            </Link>
          </>
        )}

        {(status === 'error' || status === 'expired') && (
          <>
            <div style={{ margin: '24px auto', color: '#ef4444' }}>
              <IconX size={52} />
            </div>
            <h2 style={{ fontSize: '1.3rem', marginBottom: 8, color: '#1e1b4b' }}>
              {status === 'expired' ? 'Enlace expirado' : 'Enlace inválido'}
            </h2>
            <p style={{ color: '#6b7280', marginBottom: 28, lineHeight: 1.6 }}>{message}</p>
            <Link
              to="/register"
              style={{
                background: '#4f46e5', color: '#fff', textDecoration: 'none',
                padding: '12px 32px', borderRadius: 8, fontWeight: 700, fontSize: '0.95rem',
                display: 'inline-block',
              }}
            >
              Volver al registro
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
