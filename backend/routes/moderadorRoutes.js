import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { isModerador } from '../middleware/isModerador.js';
import {
  getReportes,
  ocultarPublicacion,
  mostrarPublicacion,
  suspenderUsuario,
  levantarSuspension,
  getUsuarios,
  resolverReporte,
  getMensajesConversacion,
  getPublicacionesOcultas,
} from '../controllers/moderadorController.js';

const router = Router();

// Toda ruta requiere token válido Y rol de moderador
router.use(verifyToken, isModerador);

router.get('/reportes',                            getReportes);
router.patch('/reportes/:id/resolver',             resolverReporte);

router.patch('/publicaciones/:id/ocultar',         ocultarPublicacion);
router.patch('/publicaciones/:id/mostrar',         mostrarPublicacion);
router.get('/publicaciones/ocultas',               getPublicacionesOcultas);

router.get('/usuarios',                            getUsuarios);
router.patch('/usuarios/:id/suspender',            suspenderUsuario);
router.patch('/usuarios/:id/levantar-suspension',  levantarSuspension);

router.get('/conversaciones/:conversacionId/mensajes', getMensajesConversacion);

export default router;
