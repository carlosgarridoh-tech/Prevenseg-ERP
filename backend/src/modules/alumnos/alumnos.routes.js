import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import * as ctrl from './alumnos.controller.js';

const router = Router();

router.use(requireAuth); // todas las rutas de alumnos requieren sesión

router.get('/', ctrl.listar);
router.get('/:id', ctrl.verFicha);
router.post('/', ctrl.crear);
router.put('/:id', ctrl.actualizar);
router.delete('/:id', ctrl.eliminar);
router.delete('/:id/acceso', ctrl.eliminarAcceso);
router.post('/:id/avisos', ctrl.enviarAviso);

export default router;
