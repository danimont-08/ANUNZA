export function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short',
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
