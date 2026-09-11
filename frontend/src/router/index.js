import { createRouter, createWebHistory } from 'vue-router';
import Login from '../views/Login.vue';
import Dashboard from '../views/Dashboard.vue';
import Alumnos from '../views/Alumnos.vue';
import Cursos from '../views/Cursos.vue';
import Pagos from '../views/Pagos.vue';
import Relatores from '../views/Relatores.vue';
import Horarios from '../views/Horarios.vue';
import Documentos from '../views/Documentos.vue';
import Notificaciones from '../views/Notificaciones.vue';
import Reportes from '../views/Reportes.vue';
import Ajustes from '../views/Ajustes.vue';
import PortalAlumno from '../views/PortalAlumno.vue';

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: Login },
  { path: '/dashboard', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/alumnos', component: Alumnos, meta: { requiresAuth: true } },
  { path: '/cursos', component: Cursos, meta: { requiresAuth: true } },
  { path: '/pagos', component: Pagos, meta: { requiresAuth: true } },
  { path: '/relatores', component: Relatores, meta: { requiresAuth: true } },
  { path: '/horarios', component: Horarios, meta: { requiresAuth: true } },
  { path: '/documentos', component: Documentos, meta: { requiresAuth: true } },
  { path: '/notificaciones', component: Notificaciones, meta: { requiresAuth: true } },
  { path: '/reportes', component: Reportes, meta: { requiresAuth: true } },
  { path: '/ajustes', component: Ajustes, meta: { requiresAuth: true } },
  { path: '/portal', component: PortalAlumno, meta: { requiresAuth: true } }
];

const router = createRouter({ history: createWebHistory(), routes });

// Guardia de sesión + separación de roles: un alumno solo puede ver /portal
router.beforeEach((to) => {
  const token = localStorage.getItem('prevenseg_token');
  if (to.meta.requiresAuth && !token) return '/login';

  const usuario = JSON.parse(localStorage.getItem('prevenseg_usuario') || '{}');
  if (usuario.rol === 'alumno' && to.meta.requiresAuth && to.path !== '/portal') return '/portal';
});

export default router;
