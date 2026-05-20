import { apiFetch } from '../services/api';

export async function fetchResenaEligibilidad(publicacionId) {
  return apiFetch(`/feed/publicaciones/${publicacionId}/resenas/eligibilidad`);
}

export async function fetchResenas(publicacionId) {
  return apiFetch(`/feed/publicaciones/${publicacionId}/resenas`);
}

export async function addResenaApi(publicacionId, body) {
  return apiFetch(`/feed/publicaciones/${publicacionId}/resenas`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
