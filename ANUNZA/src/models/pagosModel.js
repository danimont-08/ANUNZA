import { apiFetch } from '../services/api';

export const fetchMiEstado = () => apiFetch('/pagos/estado');

export const fetchMisPagos = () => apiFetch('/pagos/historial');

export const destacarPublicacion = (publicacion_id) =>
  apiFetch('/pagos/destacar', {
    method: 'POST',
    body: JSON.stringify({ publicacion_id }),
  });

export const contratarPremium = () =>
  apiFetch('/pagos/premium', { method: 'POST' });
