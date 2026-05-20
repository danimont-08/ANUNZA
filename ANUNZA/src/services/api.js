const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function getStoredToken() {
  return localStorage.getItem('token');
}

/**
 * Cliente HTTP hacia el backend Express (login, feed, chat, historial).
 * El JWT es el de tu API, no Supabase Auth.
 */
export async function apiFetch(path, options = {}) {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  let data = {};
  try {
    data = await res.json();
  } catch {
    /* vacío */
  }
  if (!res.ok) {
    const err = new Error(data.message || `Error ${res.status}`);
    Object.assign(err, data); // adjunta limit_reached, etc.
    throw err;
  }
  return data;
}
