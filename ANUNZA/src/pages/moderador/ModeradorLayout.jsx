import React from 'react';
import { AdminLayout } from '../admin/AdminLayout';
import {
  fetchModStats,
  fetchModReportes,
  resolverReporte,
  marcarModReporteRevisado,
  fetchModPublicacion,
  patchModPublicacionEstado,
  fetchModUsuarios,
  suspenderUsuario,
  levantarSuspension,
} from '../../models/moderadorModel';

const MOD_CONFIG = {
  fetchStats: fetchModStats,
  fetchUsers: fetchModUsuarios,
  suspenderUser: suspenderUsuario,
  reactivarUser: levantarSuspension,
  fetchReportes: fetchModReportes,
  descartarReporte: resolverReporte,
  marcarRevisado: marcarModReporteRevisado,
  fetchPublicacion: fetchModPublicacion,
  patchPublicacion: patchModPublicacionEstado,
  puedeEliminar: false,
  puedeGestionarMods: false,
};

export function ModeradorLayout() {
  return (
    <AdminLayout
      basePath="/moderador"
      brand="ANUNZA · Moderación"
      panelConfig={MOD_CONFIG}
    />
  );
}
