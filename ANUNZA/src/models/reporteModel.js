import { apiFetch } from '../services/api';

export async function enviarReporte({ publicacion_id, motivo, descripcion }) {
  return apiFetch('/reportes', {
    method: 'POST',
    body: JSON.stringify({ publicacion_id, motivo, descripcion }),
  });
}
