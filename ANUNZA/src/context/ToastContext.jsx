import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { IconCheck, IconX, IconInfo } from '../components/icons';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.map((t) => t.id === id ? { ...t, leaving: true } : t));
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 320);
  }, []);

  const showToast = useCallback((msg, type = 'success', duration = 2800) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-2), { id, msg, type, leaving: false }]);
    clearTimeout(timers.current[id]);
    timers.current[id] = setTimeout(() => dismiss(id), duration);
  }, [dismiss]);

  useEffect(() => {
    const t = timers.current;
    return () => Object.values(t).forEach(clearTimeout);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {toasts.map(({ id, msg, type, leaving }) => (
          <div key={id} className={`toast-item toast-item--${type}${leaving ? ' toast-item--out' : ''}`}>
            <span className="toast-item__icon">
              {type === 'success' && <IconCheck size={15} />}
              {type === 'error'   && <IconX size={15} />}
              {type === 'info'    && <IconInfo size={15} />}
            </span>
            {msg}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx;
}
