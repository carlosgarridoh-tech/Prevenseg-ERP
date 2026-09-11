import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import * as ctrl from './cursos.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', ctrl.listar);
router.get('/:id', ctrl.obtener);
router.post('/', ctrl.crear);
router.put('/:id', ctrl.actualizar);
router.delete('/:id', ctrl.eliminar);

export default router;
