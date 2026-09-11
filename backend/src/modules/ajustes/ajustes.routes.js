import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import * as ctrl from './ajustes.controller.js';

const router = Router();

router.use(requireAuth, requireRole('administrador'));

router.get('/usuarios', ctrl.listarUsuarios);
router.post('/usuarios', ctrl.crearUsuario);
router.put('/usuarios/:id', ctrl.actualizarUsuario);
router.put('/usuarios/:id/password', ctrl.cambiarPassword);
router.post('/usuarios/eliminar-varios', ctrl.eliminarVariosUsuarios);
router.delete('/usuarios/:id', ctrl.eliminarUsuario);

router.get('/textos/:clave', ctrl.obtenerTexto);
router.put('/textos/:clave', ctrl.actualizarTexto);

router.get('/config-apis', ctrl.obtenerConfigApis);
router.put('/config-apis', ctrl.actualizarConfigApis);

router.get('/respaldo/base-datos', ctrl.respaldoBaseDatos);
router.get('/respaldo/archivos', ctrl.respaldoArchivos);

export default router;
