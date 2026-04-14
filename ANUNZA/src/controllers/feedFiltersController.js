/**
 * Lógica de filtros del feed: combina categoría + ciudad.
 */
export function buildFeedQuery(prev, patch) {
  return { ...prev, ...patch };
}

export function filtersAreActive(f) {
  return !!(f.categoria_id || (f.ciudad && String(f.ciudad).trim()));
}
