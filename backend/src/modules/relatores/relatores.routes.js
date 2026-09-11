import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import * as ctrl from './relatores.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', ctrl.listar);
router.post('/', ctrl.crear);
router.put('/:id', ctrl.actualizar);
router.delete('/:id', ctrl.eliminar);
router.post('/:id/asignar', ctrl.asignar);
router.delete('/:id/asignar/:cursoId', ctrl.quitarAsignacion);

export default router;
