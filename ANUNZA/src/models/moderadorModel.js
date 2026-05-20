import { apiFetch } from '../services/api';

export const fetchModStats = () =>
  apiFetch('/moderador/stats');

export const fetchModReportes = () =>
  apiFetch('/moderador/reportes');

export const fetchReportes = fetchModReportes;

export const resolverReporte = (id) =>
  apiFetch(`/moderador/reportes/${id}/resolver`, { method: 'DELETE' });

export const marcarModReporteRevisado = (id) =>
  apiFetch(`/moderador/reportes/${id}/estado`, { method: 'PATCH' });

export const ocultarPublicacion = (id) =>
  apiFetch(`/moderador/publicaciones/${id}/ocultar`, { method: 'PATCH' });

export const mostrarPublicacion = (id) =>
  apiFetch(`/moderador/publicaciones/${id}/mostrar`, { method: 'PATCH' });

export const fetchPublicacionesOcultas = () =>
  apiFetch('/moderador/publicaciones/ocultas');

export const fetchModPublicacion = (id) =>
  apiFetch(`/moderador/publicaciones/${id}`);

export const patchModPublicacionEstado = (id, estado) => {
  if (estado === 'oculto') return ocultarPublicacion(id);
  if (estado === 'activo') return mostrarPublicacion(id);
  return Promise.reject(new Error('Operación no permitida para moderadores'));
};

export const fetchModUsuarios = ({ estado, q } = {}) => {
  const params = new URLSearchParams();
  if (estado) params.set('estado', estado);
  if (q) params.set('q', q);
  const suffix = params.toString() ? `?${params.toString()}` : '';
  return apiFetch(`/moderador/usuarios${suffix}`);
};

export const fetchUsuarios = fetchModUsuarios;

export const suspenderUsuario = (id) =>
  apiFetch(`/moderador/usuarios/${id}/suspender`, { method: 'PATCH' });

export const levantarSuspension = (id) =>
  apiFetch(`/moderador/usuarios/${id}/levantar-suspension`, { method: 'PATCH' });

export const fetchMensajesConversacion = (conversacionId) =>
  apiFetch(`/moderador/conversaciones/${conversacionId}/mensajes`);
