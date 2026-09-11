import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import * as ctrl from './notificaciones.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/whatsapp/estado', ctrl.estadoWhatsapp);
router.post('/whatsapp/reiniciar', ctrl.reiniciarWhatsapp);
router.post('/enviar', ctrl.enviar);

export default router;
