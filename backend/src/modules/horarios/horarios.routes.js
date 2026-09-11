import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import * as ctrl from './horarios.controller.js';
import { exportarExcel } from './horarios.export.js';

const router = Router();

router.use(requireAuth);

router.get('/curso/:cursoId', ctrl.porCurso);
router.get('/curso/:cursoId/exportar', exportarExcel);
router.post('/', ctrl.crear);
router.put('/:id', ctrl.actualizar);
router.delete('/:id', ctrl.eliminar);

export default router;
