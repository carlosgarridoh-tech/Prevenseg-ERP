import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import * as ctrl from './portal-alumno.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/mis-datos', ctrl.misDatos);
router.get('/mi-horario', ctrl.miHorario);
router.get('/mi-certificado', ctrl.miCertificado);
router.get('/comentarios', ctrl.listarComentarios);
router.post('/comentarios', ctrl.crearComentario);
router.get('/avisos', ctrl.misAvisos);
router.get('/recursos', ctrl.misRecursos);
router.get('/recursos/:id/descargar', ctrl.descargarRecurso);

export default router;
