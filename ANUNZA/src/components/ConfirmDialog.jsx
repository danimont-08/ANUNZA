import React, { useEffect } from 'react';
import './ConfirmDialog.css';

export function ConfirmDialog({ message, confirmLabel = 'Confirmar', danger = false, onConfirm, onCancel }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div className="cdlg-backdrop" role="presentation" onClick={onCancel}>
      <div className="cdlg-box" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <p className="cdlg-msg">{message}</p>
        <div className="cdlg-actions">
          <button type="button" className="cdlg-cancel" onClick={onCancel}>Cancelar</button>
          <button type="button" className={`cdlg-ok${danger ? ' danger' : ''}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}