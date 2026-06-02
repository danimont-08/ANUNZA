import { apiFetch } from '../services/api';

export async function fetchCategorias() {
  return apiFetch('/feed/categorias');
}

export async function fetchFeed({
  categoria_id,
  subcategoria_id,
  ciudad,
  precio_min,
  precio_max,
  calificacion_min,
  q,
  tipo,
  offset,
  limit,
} = {}) {
  const params = new URLSearchParams();
  if (categoria_id) params.set('categoria_id', String(categoria_id));
  if (subcategoria_id) params.set('subcategoria_id', String(subcategoria_id));
  if (ciudad && String(ciudad).trim()) params.set('ciudad', String(ciudad).trim());
  if (precio_min != null && precio_min !== '') params.set('precio_min', String(precio_min));
  if (precio_max != null && precio_max !== '') params.set('precio_max', String(precio_max));
  if (calificacion_min != null && calificacion_min !== '') params.set('calificacion_min', String(calificacion_min));
  if (q && String(q).trim()) params.set('q', String(q).trim());
  if (tipo && (tipo === 'ofrezco' || tipo === 'busco')) params.set('tipo', tipo);
  if (offset != null && offset > 0) params.set('offset', String(offset));
  if (limit != null) params.set('limit', String(limit));
  const suffix = params.toString() ? `?${params.toString()}` : '';
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

export async function editarPublicacion(publicacionId, body) {
  return apiFetch(`/feed/publicaciones/${publicacionId}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function toggleGuardarPublicacion(publicacionId) {
  return apiFetch(`/feed/publicaciones/${publicacionId}/guardar`, { method: 'POST' });
}

export async function deletePublicacion(publicacionId) {
  return apiFetch(`/feed/publicaciones/${publicacionId}`, { method: 'DELETE' });
}

export async function toggleComentarioLike(comentarioId) {
  return apiFetch(`/feed/comentarios/${comentarioId}/like`, { method: 'POST' });
}

export async function addRespuesta(publicacionId, contenido, parentId) {
  return apiFetch(`/feed/publicaciones/${publicacionId}/comentarios`, {
    method: 'POST',
    body: JSON.stringify({ contenido, parent_id: parentId }),
  });
}
