/** Convierte coordenadas en nombre de ciudad usando Nominatim. */
async function reverseGeocode(lat, lon) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=es`,
    );
    const data = await res.json();
    const a = data.address || {};
    return (
      a.city || a.town || a.municipality || a.village || a.suburb || a.county || ''
    );
  } catch {
    return '';
  }
}

/** Fallback: ubica por dirección IP (menos preciso, no requiere permiso GPS). */
async function geolocateByIP() {
  const res = await fetch('https://ipapi.co/json/');
  const data = await res.json();
  if (!data.latitude || !data.longitude) throw new Error('Sin datos de IP');
  return {
    lat:  data.latitude,
    lon:  data.longitude,
    city: data.city || data.region || '',
    source: 'ip',
  };
}

/**
 * Obtiene la ubicación del usuario:
 * 1. Intenta geolocalización del dispositivo (GPS/WiFi).
 * 2. Si falla o tarda, usa geolocalización por IP como respaldo.
 *
 * Resuelve con: { lat, lon, city, source: 'gps' | 'ip' }
 */
export function geolocateToCity() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      // Sin soporte de geolocalización → ir directo al fallback por IP
      geolocateByIP().then(resolve).catch(() =>
        reject(new Error('No se pudo obtener la ubicación.'))
      );
      return;
    }

    let settled = false;

    // Timeout manual: si el GPS no responde en 6 s, usamos IP
    const ipFallbackTimer = setTimeout(async () => {
      if (settled) return;
      try {
        const result = await geolocateByIP();
        if (!settled) { settled = true; resolve(result); }
      } catch {
        // Esperamos a que el GPS responda (puede llegar tarde)
      }
    }, 6000);

    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lon } }) => {
        clearTimeout(ipFallbackTimer);
        if (settled) return;
        settled = true;
        const city = await reverseGeocode(lat, lon);
        resolve({ lat, lon, city, source: 'gps' });
      },
      async (err) => {
        clearTimeout(ipFallbackTimer);
        if (settled) return;
        // GPS denegado explícitamente → no usar fallback IP, informar al usuario
        if (err.code === 1) {
          settled = true;
          reject(new Error('Permiso de ubicación denegado. Habilítalo en el candado de la barra de direcciones.'));
          return;
        }
        // Para timeout o posición no disponible → fallback IP
        try {
          const result = await geolocateByIP();
          if (!settled) { settled = true; resolve(result); }
        } catch {
          if (!settled) { settled = true; reject(new Error('No se pudo obtener la ubicación.')); }
        }
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 }
    );
  });
}

/** Genera la URL del iframe de OpenStreetMap para mostrar un pin en la posición. */
export function osmEmbedUrl(lat, lon, zoom = 13) {
  const delta = zoom === 13 ? 0.05 : 0.02;
  return (
    `https://www.openstreetmap.org/export/embed.html` +
    `?bbox=${lon - delta},${lat - delta},${lon + delta},${lat + delta}` +
    `&layer=mapnik&marker=${lat},${lon}`
  );
}
