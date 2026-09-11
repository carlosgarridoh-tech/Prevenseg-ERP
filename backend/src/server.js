import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import 'dotenv/config';

import authRoutes from './modules/auth/auth.routes.js';
import portalAlumnoRoutes from './modules/portal-alumno/portal-alumno.routes.js';
import alumnosRoutes from './modules/alumnos/alumnos.routes.js';
import cursosRoutes from './modules/cursos/cursos.routes.js';
import pagosRoutes from './modules/pagos/pagos.routes.js';
import relatoresRoutes from './modules/relatores/relatores.routes.js';
import horariosRoutes from './modules/horarios/horarios.routes.js';
import documentosRoutes from './modules/documentos/documentos.routes.js';
import notificacionesRoutes from './modules/notificaciones/notificaciones.routes.js';
import reportesRoutes from './modules/reportes/reportes.routes.js';
import ajustesRoutes from './modules/ajustes/ajustes.routes.js';
import pagosRelatoresRoutes from './modules/pagos-relatores/pagos-relatores.routes.js';
import { requireAuth, bloquearAlumnos } from './middleware/auth.js';

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || '*', exposedHeaders: ['Content-Disposition', 'X-Pdf-Fallo'] }));
app.use(express.json());
app.use(morgan('dev'));

// Login y Portal del Alumno: accesibles para el rol "alumno"
app.use('/api/auth', authRoutes);
app.use('/api/portal', portalAlumnoRoutes);

// A partir de aquí, TODO lo demás queda bloqueado para el rol "alumno":
// solo administrador/ventas/finanzas pueden usar el resto del sistema.
app.use('/api', requireAuth, bloquearAlumnos);

// Los roles "ventas" y "finanzas" solo pueden LEER (nunca crear/modificar/eliminar) y
// solo en los módulos: alumnos, pagos, cursos, horarios, relatores y reportes.
const MODULOS_PERMITIDOS_LECTURA = ['/alumnos', '/pagos', '/cursos', '/horarios', '/relatores', '/reportes'];
app.use('/api', (req, res, next) => {
  if (req.user?.rol !== 'ventas' && req.user?.rol !== 'finanzas') return next();
  const rutaPermitida = MODULOS_PERMITIDOS_LECTURA.some((m) => req.path === m || req.path.startsWith(m + '/'));
  if (!rutaPermitida) return res.status(403).json({ error: 'Tu rol no tiene acceso a este módulo' });
  if (req.method !== 'GET') return res.status(403).json({ error: 'Tu rol solo tiene permisos de lectura' });
  next();
});

// Cada módulo vive en su propia ruta -> modificar uno no afecta a los demás
app.use('/api/alumnos', alumnosRoutes);
app.use('/api/cursos', cursosRoutes);
app.use('/api/pagos', pagosRoutes);
app.use('/api/relatores', relatoresRoutes);
app.use('/api/horarios', horariosRoutes);
app.use('/api/documentos', documentosRoutes);
app.use('/api/notificaciones', notificacionesRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/ajustes', ajustesRoutes);
app.use('/api/pagos-relatores', pagosRelatoresRoutes);

app.get('/', (req, res) => res.json({ ok: true, sistema: 'Prevenseg ERP API' }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Backend Prevenseg corriendo en http://localhost:${PORT}`));
