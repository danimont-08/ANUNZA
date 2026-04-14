import { apiFetch } from '../services/api';

export async function fetchNotificaciones() {
  return apiFetch('/notificaciones');
}

export async function marcarNotificacionLeida(id) {
  return apiFetch(`/notificaciones/${id}/leer`, { method: 'PATCH' });
}

export async function marcarTodasLeidasApi() {
  return apiFetch('/notificaciones/leer-todas', { method: 'PATCH' });
}
