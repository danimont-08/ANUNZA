import { apiFetch } from '../services/api';

export async function fetchAdminStats() {
  return apiFetch('/admin/stats');
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

export async function fetchAdminReportes() {
  return apiFetch('/admin/reportes');
}

export async function patchReporteEstado(reporteId) {
  return apiFetch(`/admin/reportes/${reporteId}`, { method: 'DELETE' });
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
