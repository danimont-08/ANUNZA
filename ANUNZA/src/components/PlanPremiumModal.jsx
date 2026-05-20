import React, { useState } from 'react';
import { contratarPremium } from '../models/pagosModel';
import './feed/DestacarModal.css';

export function PlanPremiumModal({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [done, setDone]       = useState(false);

  const handlePagar = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await contratarPremium();
      setDone(true);
      onSuccess?.(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pago-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="pago-modal">
        <button type="button" className="pago-close" onClick={onClose}>✕</button>

        {done ? (
          <div className="pago-success">
            <div className="pago-success-icon">💜</div>
            <h3>¡Plan Premium activado!</h3>
            <p>Ya puedes publicar <strong>sin límites</strong> y acceder a funciones exclusivas.</p>
            <button type="button" className="pago-btn-primary" onClick={onClose}>¡Genial!</button>
          </div>
        ) : (
          <>
            <div className="pago-icon">💜</div>
            <h3 className="pago-title">Plan Premium</h3>
            <p className="pago-pub-name">Lleva tu cuenta al siguiente nivel</p>

            <ul className="pago-benefits">
              <li>✓ Publicaciones ilimitadas</li>
              <li>✓ Insignia Premium en tu perfil</li>
              <li>✓ Prioridad en búsquedas</li>
              <li>✓ Destacar publicaciones a precio especial</li>
            </ul>

            <div className="pago-price-box">
              <span className="pago-price">$29.900 COP</span>
              <span className="pago-period">/ mes</span>
            </div>

            <div className="pago-simulated-note">
              🔒 Pago simulado — en producción se integraría con pasarela de pago
            </div>

            {error && <p className="pago-error">{error}</p>}

            <div className="pago-actions">
              <button type="button" className="pago-btn-ghost" onClick={onClose}>
                Ahora no
              </button>
              <button
                type="button"
                className="pago-btn-primary"
                onClick={handlePagar}
                disabled={loading}
              >
                {loading ? 'Procesando…' : 'Activar Premium'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
