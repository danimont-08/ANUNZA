import { apiFetch } from '../services/api';

export async function fetchCategorias() {
  return apiFetch('/feed/categorias');
}

export async function fetchFeed({ categoria_id, ciudad } = {}) {
  const q = new URLSearchParams();
  if (categoria_id) q.set('categoria_id', String(categoria_id));
  if (ciudad && String(ciudad).trim()) q.set('ciudad', String(ciudad).trim());
  const suffix = q.toString() ? `?${q.toString()}` : '';
  return apiFetch(`/feed${suffix}`);
}

export async function crearPublicacion(body) {
  return apiFetch('/feed/publicaciones', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function toggleLikePost(publicacionId) {
  return apiFetch(`/feed/publicaciones/${publicacionId}/like`, { method: 'POST' });
}

export async function fetchComentarios(publicacionId) {
  return apiFetch(`/feed/publicaciones/${publicacionId}/comentarios`);
}

export async function addComentarioApi(publicacionId, contenido) {
  return apiFetch(`/feed/publicaciones/${publicacionId}/comentarios`, {
    method: 'POST',
    body: JSON.stringify({ contenido }),
  });
}

export async function enviarReporte({ tipo, objeto_id, motivo, detalles }) {
  return apiFetch('/reportes', {
    method: 'POST',
    body: JSON.stringify({ tipo, objeto_id, motivo, detalles }),
  });
}

export async function toggleFavoritoPost(publicacionId) {
  return apiFetch(`/feed/publicaciones/${publicacionId}/favorito`, { method: 'POST' });
}

export async function deletePublicacionApi(publicacionId) {
  return apiFetch(`/feed/publicaciones/${publicacionId}`, { method: 'DELETE' });
}

export async function deleteComentarioApi(comentarioId) {
  return apiFetch(`/feed/comentarios/${comentarioId}`, { method: 'DELETE' });
}

export async function toggleLikeComentarioApi(comentarioId) {
  return apiFetch(`/feed/comentarios/${comentarioId}/like`, { method: 'POST' });
}
