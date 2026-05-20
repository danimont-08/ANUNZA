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
  calificacion_min 
} = {}) {
  const q = new URLSearchParams();
  if (categoria_id) q.set('categoria_id', String(categoria_id));
  if (subcategoria_id) q.set('subcategoria_id', String(subcategoria_id));
  if (ciudad && String(ciudad).trim()) q.set('ciudad', String(ciudad).trim());
  if (precio_min != null && precio_min !== '') q.set('precio_min', String(precio_min));
  if (precio_max != null && precio_max !== '') q.set('precio_max', String(precio_max));
  if (calificacion_min != null && calificacion_min !== '') q.set('calificacion_min', String(calificacion_min));
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
