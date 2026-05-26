import { apiFetch } from '../services/api';

export async function fetchAdminStats() {
  return apiFetch('/admin/stats');
}

export async function fetchAdminPublicaciones(estado = 'activo') {
  return apiFetch(`/admin/publicaciones?estado=${estado}`);
}

export async function fetchAdminUsers({ estado, q } = {}) {
  const params = new URLSearchParams();
  if (estado) params.set('estado', estado);
  if (q) params.set('q', q);
  const suffix = params.toString() ? `?${params.toString()}` : '';
  return apiFetch(`/admin/users${suffix}`);
}

export async function patchUserEstado(userId, estado) {
  return apiFetch(`/admin/users/${userId}/estado`, {
    method: 'PATCH',
    body: JSON.stringify({ estado }),
  });
}

export async function fetchAdminReportes(estado = 'pendiente') {
  return apiFetch(`/admin/reportes?estado=${estado}`);
}

export async function patchReporteEstado(reporteId) {
  return apiFetch(`/admin/reportes/${reporteId}`, { method: 'DELETE' });
}

export async function marcarReporteRevisado(reporteId) {
  return apiFetch(`/admin/reportes/${reporteId}/estado`, { method: 'PATCH' });
}

export async function fetchAdminUsuario(userId) {
  return apiFetch(`/admin/users/${userId}`);
}

export async function fetchAdminUserPublicaciones(userId) {
  return apiFetch(`/admin/users/${userId}/publicaciones`);
}

export async function fetchAdminPublicacion(publicacionId) {
  return apiFetch(`/admin/publicaciones/${publicacionId}`);
}

export async function patchPublicacionEstado(publicacionId, estado) {
  return apiFetch(`/admin/publicaciones/${publicacionId}`, {
    method: 'PATCH',
    body: JSON.stringify({ estado }),
  });
}
