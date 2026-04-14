/**
 * Serialización de descripción e imagen sin columnas extra en BD (JSON en text).
 */

export function extractHashtagsFromText(str) {
  if (!str) return [];
  const m = String(str).match(/#[\p{L}\p{N}_]+/gu);
  if (!m) return [];
  return [...new Set(m.map((t) => t.slice(1)))];
}

export function serializeDescripcion({ text, hashtags, service }) {
  const base = String(text || '').trim();
  const tags = Array.isArray(hashtags) ? hashtags.map((t) => String(t).replace(/^#/, '')) : [];
  const includeService = service && typeof service === 'object';

  if (!tags.length && !includeService) return base;

  const out = { text: base, hashtags: tags };
  if (includeService) {
    out.service = {
      materiales: String(service.materiales || '').trim(),
      tiempo_estimado: String(service.tiempo_estimado || '').trim(),
      detalles: String(service.detalles || '').trim(),
    };
  }
  return JSON.stringify(out);
}

export function parseDescripcion(raw) {
  if (raw == null) return { text: '', hashtags: [], service: null };
  const s = String(raw).trim();
  if (!s.startsWith('{')) {
    return { text: raw, hashtags: extractHashtagsFromText(raw), service: null };
  }
  try {
    const j = JSON.parse(s);
    const text = j.text != null ? String(j.text) : '';
    const fromJson = Array.isArray(j.hashtags) ? j.hashtags : [];
    const merged = [...new Set([...fromJson, ...extractHashtagsFromText(text)])];
    return {
      text,
      hashtags: merged,
      service: j.service && typeof j.service === 'object' ? j.service : null,
    };
  } catch {
    return { text: raw, hashtags: extractHashtagsFromText(raw), service: null };
  }
}

export function parseImagen(raw) {
  if (raw == null || raw === '') return [];
  const s = String(raw).trim();
  if (s.startsWith('{')) {
    try {
      const j = JSON.parse(s);
      if (j.items && Array.isArray(j.items)) {
        return j.items
          .filter((it) => it && it.url)
          .map((it) => ({
            url: String(it.url),
            type: it.type === 'video' ? 'video' : 'image',
          }));
      }
    } catch {
      /* continuar */
    }
  }
  if (s.startsWith('http') || s.startsWith('data:')) {
    const isVid = /^data:video\//i.test(s) || /\.(mp4|webm|ogg)(\?|$)/i.test(s);
    return [{ url: s, type: isVid ? 'video' : 'image' }];
  }
  return [];
}

export function serializeMediaItems(items) {
  if (!items || !Array.isArray(items) || items.length === 0) return null;
  const clean = items
    .filter((it) => it && it.url)
    .map((it) => ({
      url: String(it.url),
      type: it.type === 'video' ? 'video' : 'image',
    }));
  if (!clean.length) return null;
  return JSON.stringify({ items: clean });
}

export function enrichPublicacionRow(row) {
  const d = parseDescripcion(row.descripcion);
  const media_items = parseImagen(row.imagen);
  return {
    ...row,
    texto_plano: d.text,
    hashtags: d.hashtags,
    service_detalle: d.service,
    media_items,
  };
}
