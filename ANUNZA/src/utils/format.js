const _copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatCOP(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return '';
  return _copFormatter.format(n);
}

const TZ = 'America/Bogota';

export function formatDate(iso) {
  if (!iso) return '';
  try {
    const normalized = String(iso).trim().replace(' ', 'T');
    const str = /Z$|[+-]\d{2}:?\d{2}$/.test(normalized) ? normalized : normalized + 'Z';
    return new Date(str).toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: TZ,
    });
  } catch { return ''; }
}

export function formatTime(iso) {
  if (!iso) return '';
  try {
    const str = /Z$|[+-]\d{2}:\d{2}$/.test(String(iso)) ? iso : iso + 'Z';
    return new Date(str).toLocaleTimeString('es-CO', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: TZ,
    });
  } catch { return ''; }
}
