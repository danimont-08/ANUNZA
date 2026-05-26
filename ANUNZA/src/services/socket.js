import { io } from 'socket.io-client';

const SOCKET_URL = (() => {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  // Si es relativo (/api), conectar al mismo origen (Vite proxia /socket.io al backend)
  if (base.startsWith('/')) return window.location.origin;
  return base.replace(/\/api$/, '');
})();

let _socket = null;

export function connectSocket(token) {
  if (_socket) return _socket;
  _socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });
  return _socket;
}

export function getSocket() {
  return _socket;
}

export function disconnectSocket() {
  if (_socket) {
    _socket.disconnect();
    _socket = null;
  }
}