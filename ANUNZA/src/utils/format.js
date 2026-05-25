export function formatDate(iso) {
  if (!iso) return '';
  try {
    // Supabase a veces manda "2025-05-25 15:30:00" con espacio — normalizamos a ISO 8601
    const normalized = String(iso).trim().replace(' ', 'T');
    // Si no tiene zona horaria explícita, asumir UTC (Supabase guarda en UTC)
    const str = /Z$|[+-]\d{2}:?\d{2}$/.test(normalized) ? normalized : normalized + 'Z';
    return new Date(str).toLocaleString(undefined, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch { return ''; }
}

export function formatTime(iso) {
  if (!iso) return '';
  try {
    const str = /Z$|[+-]\d{2}:\d{2}$/.test(String(iso)) ? iso : iso + 'Z';
    return new Date(str).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}
