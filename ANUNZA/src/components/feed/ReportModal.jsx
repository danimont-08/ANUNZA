import React, { useState } from 'react';
import { enviarReporte } from '../../models/reporteModel';
import './ReportModal.css';

const MOTIVOS = [
  { value: 'spam',        label: '📢 Spam o publicidad engañosa' },
  { value: 'inapropiado', label: '🔞 Contenido inapropiado' },
  { value: 'fraude',      label: '💸 Fraude o estafa' },
  { value: 'acoso',       label: '⚠️ Acoso o intimidación' },
  { value: 'otro',        label: '❓ Otro motivo' },
];

const TITULOS = {
  publicacion: 'Reportar publicación',
  usuario:     'Reportar usuario',
  mensaje:     'Reportar mensaje',
};

const LEYENDAS = {
  publicacion: '¿Por qué reportas esta publicación?',
  usuario:     '¿Por qué reportas a este usuario?',
  mensaje:     '¿Por qué reportas este mensaje?',
};

export function ReportModal({ tipo = 'publicacion', targetId, targetLabel, onClose }) {
  const [motivo, setMotivo] = useState('');
  const [detalles, setDetalles] = useState('');
  const [loading, setLoading] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!motivo) { setError('Selecciona un motivo'); return; }
    setLoading(true);
    setError('');
    try {
      await enviarReporte({ tipo, objeto_id: targetId, motivo, detalles });
      setExito(true);
    } catch (err) {
      setError(err.message || 'Error al enviar el reporte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="report-backdrop" role="presentation" onClick={onClose}>
      <div className="report-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        {exito ? (
          <div className="report-success">
            <span className="report-success-icon">✅</span>
            <h3>Reporte enviado</h3>
            <p>Gracias por contribuir a la comunidad ANUNZA.</p>
            <button type="button" className="report-btn-primary" onClick={onClose}>Cerrar</button>
          </div>
        ) : (
          <>
            <div className="report-head">
              <h3>{TITULOS[tipo] ?? 'Reportar'}</h3>
              <button type="button" className="report-close" onClick={onClose} aria-label="Cerrar">✕</button>
            </div>
            {targetLabel && (
              <p className="report-pub-name">"{targetLabel}"</p>
            )}
            <form onSubmit={handleSubmit}>
              <fieldset className="report-motivos">
                <legend>{LEYENDAS[tipo] ?? '¿Por qué realizas este reporte?'}</legend>
                {MOTIVOS.map((m) => (
                  <label key={m.value} className={`report-option ${motivo === m.value ? 'is-selected' : ''}`}>
                    <input
                      type="radio"
                      name="motivo"
                      value={m.value}
                      checked={motivo === m.value}
                      onChange={() => setMotivo(m.value)}
                    />
                    {m.label}
                  </label>
                ))}
              </fieldset>
              <textarea
                className="report-textarea"
                placeholder="Detalles adicionales (opcional, máx. 300 caracteres)"
                maxLength={300}
                value={detalles}
                onChange={(e) => setDetalles(e.target.value)}
                rows={3}
              />
              {error && <p className="report-error">{error}</p>}
              <div className="report-actions">
                <button type="button" className="report-btn-cancel" onClick={onClose}>Cancelar</button>
                <button type="submit" className="report-btn-primary" disabled={loading}>
                  {loading ? 'Enviando…' : 'Enviar reporte'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
