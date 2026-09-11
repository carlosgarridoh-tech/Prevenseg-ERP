import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import * as ctrl from './reportes.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/pago-completo/exportar', ctrl.exportarPagoCompleto);
router.get('/:tipo/exportar', ctrl.exportar);
router.get('/:tipo', ctrl.ver);

export default router;
