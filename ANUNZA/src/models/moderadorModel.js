import { apiFetch } from '../services/api';

export const fetchReportes = () =>
  apiFetch('/moderador/reportes');

export const resolverReporte = (id, accion) =>
  apiFetch(`/moderador/reportes/${id}/resolver`, {
    method: 'PATCH',
    body: JSON.stringify({ accion }),
  });

export const ocultarPublicacion = (id) =>
  apiFetch(`/moderador/publicaciones/${id}/ocultar`, { method: 'PATCH' });

export const mostrarPublicacion = (id) =>
  apiFetch(`/moderador/publicaciones/${id}/mostrar`, { method: 'PATCH' });

export const fetchPublicacionesOcultas = () =>
  apiFetch('/moderador/publicaciones/ocultas');

export const fetchUsuarios = () =>
  apiFetch('/moderador/usuarios');

export const suspenderUsuario = (id, dias) =>
  apiFetch(`/moderador/usuarios/${id}/suspender`, {
    method: 'PATCH',
    body: JSON.stringify({ dias }),
  });

export const levantarSuspension = (id) =>
  apiFetch(`/moderador/usuarios/${id}/levantar-suspension`, { method: 'PATCH' });

export const fetchMensajesConversacion = (conversacionId) =>
  apiFetch(`/moderador/conversaciones/${conversacionId}/mensajes`);
