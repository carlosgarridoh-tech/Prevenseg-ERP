import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import * as ctrl from './pagos.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/config/texto-comprobante', ctrl.obtenerTextoComprobante);
router.get('/curso/:cursoId', ctrl.porCurso);
router.get('/alumno/:alumnoId', ctrl.porAlumno);
router.post('/', ctrl.registrar);
// Solo el administrador puede anular pagos (RF-FIN-03)
router.put('/:id/anular', requireRole('administrador'), ctrl.anular);

export default router;
