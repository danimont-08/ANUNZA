import React, { useState } from 'react';
import { enviarReporte } from '../../models/reporteModel';
import './ReportModal.css';

const IcSpam      = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>;
const IcContent   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
const IcFraud     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IcHarass    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
const IcOther     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;

const MOTIVOS = [
  { value: 'spam',        label: 'Spam o publicidad engañosa',  Icon: IcSpam    },
  { value: 'inapropiado', label: 'Contenido inapropiado',       Icon: IcContent },
  { value: 'fraude',      label: 'Fraude o estafa',             Icon: IcFraud   },
  { value: 'acoso',       label: 'Acoso o intimidación',        Icon: IcHarass  },
  { value: 'otro',        label: 'Otro motivo',                 Icon: IcOther   },
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
                {MOTIVOS.map(({ value, label, Icon }) => (
                  <label key={value} className={`report-option ${motivo === value ? 'is-selected' : ''}`}>
                    <input
                      type="radio"
                      name="motivo"
                      value={value}
                      checked={motivo === value}
                      onChange={() => setMotivo(value)}
                    />
                    <Icon />
                    {label}
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
