/**
 * Controlador: arma el payload de creación de publicación desde el estado del formulario.
 */

export function buildCreatePublicacionPayload(state) {
  const {
    titulo,
    descripcion,
    categoria_id,
    tipo,
    agregar_servicio,
    precio,
    materiales,
    tiempo_estimado,
    detalles_adicionales,
    hashtagInput,
    mediaItems,
  } = state;

  const tagList = parseHashtagInput(hashtagInput);

  return {
    titulo: titulo?.trim() || '',
    descripcion: descripcion?.trim() || '',
    categoria_id: Number(categoria_id),
    tipo: tipo === 'busco' ? 'busco' : 'ofrezco',
    agregar_servicio: !!agregar_servicio,
    precio: agregar_servicio && precio !== '' ? Number(precio) : null,
    service: agregar_servicio
      ? {
          materiales: materiales?.trim() || '',
          tiempo_estimado: tiempo_estimado?.trim() || '',
          detalles: detalles_adicionales?.trim() || '',
        }
      : null,
    hashtags: tagList,
    media: (mediaItems || []).map((m) => ({ url: m.url, type: m.type })),
  };
}

export function parseHashtagInput(raw) {
  if (!raw || !String(raw).trim()) return [];
  return String(raw)
    .split(/[\s,]+/)
    .map((t) => t.replace(/^#/, '').trim())
    .filter(Boolean);
}

export function validateCreatePayload(payload) {
  if (!payload.titulo || !String(payload.titulo).trim()) return 'Escribe un título para la publicación.';
  if (!payload.descripcion) return 'Escribe una descripción.';
  if (!payload.categoria_id || Number.isNaN(payload.categoria_id)) return 'Elige una categoría.';
  return null;
}
