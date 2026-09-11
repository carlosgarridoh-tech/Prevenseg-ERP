import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import * as ctrl from './pagos-relatores.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/relator/:relatorId', ctrl.porRelator);
router.post('/', ctrl.registrar);
router.delete('/:id', requireRole('administrador'), ctrl.eliminar);

export default router;
