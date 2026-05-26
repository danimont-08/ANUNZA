import React, { useEffect, useRef, useState } from 'react';
import './Toast.css';

/**
 * useToast() — devuelve { showToast, ToastEl }
 * showToast(msg, type='success', duration=2200)
 */
export function useToast() {
  const [state, setState] = useState({ msg: '', type: 'success', visible: false });
  const timerRef = useRef(null);

  const showToast = (msg, type = 'success', duration = 2200) => {
    clearTimeout(timerRef.current);
    setState({ msg, type, visible: true });
    timerRef.current = setTimeout(() => setState((s) => ({ ...s, visible: false })), duration);
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const ToastEl = (
    <div className={`toast toast--${state.type}${state.visible ? ' toast--visible' : ''}`}>
      {state.msg}
    </div>
  );

  return { showToast, ToastEl };
}