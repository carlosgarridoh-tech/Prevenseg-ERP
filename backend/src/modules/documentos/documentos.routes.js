import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { uploadPlantilla, uploadRecurso } from './upload.config.js';
import * as ctrl from './documentos.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/plantillas', ctrl.listarPlantillas);
router.post('/plantillas', requireRole('administrador'), uploadPlantilla.single('archivo'), ctrl.subirPlantilla);
router.post('/generar', ctrl.generar);
router.get('/generar/:jobId/estado', ctrl.estadoGenerar);
router.get('/generar/:jobId/descargar', ctrl.descargarGenerar);
router.get('/recursos', ctrl.listarRecursos);
router.post('/recursos', uploadRecurso.single('archivo'), ctrl.subirRecurso);
router.delete('/recursos/:id', requireRole('administrador'), ctrl.eliminarRecurso);

export default router;
