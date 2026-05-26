import React, { useState } from 'react';
import { destacarPublicacion } from '../../models/pagosModel';
import { IconStar, IconCheck, IconLock, IconX } from '../icons';
import './DestacarModal.css';

export function DestacarModal({ publicacion, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [done, setDone]       = useState(false);

  const handlePagar = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await destacarPublicacion(publicacion.id);
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
        <button type="button" className="pago-close" onClick={onClose}><IconX size={16}/></button>

        {done ? (
          <div className="pago-success">
            <div className="pago-success-icon"><IconStar size={32}/></div>
            <h3>¡Publicación destacada!</h3>
            <p>Tu publicación aparecerá en la parte superior del feed durante <strong>7 días</strong>.</p>
            <button type="button" className="pago-btn-primary" onClick={onClose}>Entendido</button>
          </div>
        ) : (
          <>
            <div className="pago-icon"><IconStar size={32}/></div>
            <h3 className="pago-title">Destacar publicación</h3>
            <p className="pago-pub-name">"{publicacion.titulo}"</p>

            <ul className="pago-benefits">
              <li><><IconCheck size={14}/> Aparece en la parte superior del feed</></li>
              <li><><IconCheck size={14}/> Insignia "Destacado" visible</></li>
              <li><><IconCheck size={14}/> Mayor visibilidad por 7 días</></li>
            </ul>

            <div className="pago-price-box">
              <span className="pago-price">$9.900 COP</span>
              <span className="pago-period">por 7 días</span>
            </div>

            <div className="pago-simulated-note">
              <><IconLock size={14}/> Pago simulado — en producción se integraría con pasarela de pago</>
            </div>

            {error && <p className="pago-error">{error}</p>}

            <div className="pago-actions">
              <button type="button" className="pago-btn-ghost" onClick={onClose}>
                Cancelar
              </button>
              <button
                type="button"
                className="pago-btn-primary"
                onClick={handlePagar}
                disabled={loading}
              >
                {loading ? 'Procesando…' : 'Confirmar pago'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
