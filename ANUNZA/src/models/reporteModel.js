import { apiFetch } from '../services/api';

// El backend espera campo específico según tipo:
// publicacion → publicacion_id, usuario → usuario_id, mensaje → mensaje_id
export async function enviarReporte({ tipo, objeto_id, motivo, detalles }) {
  const body = { tipo, motivo, detalles };
  if (tipo === 'publicacion') body.publicacion_id = objeto_id;
  else if (tipo === 'usuario') body.usuario_id = objeto_id;
  else if (tipo === 'mensaje') body.mensaje_id = objeto_id;

  return apiFetch('/reportes', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
