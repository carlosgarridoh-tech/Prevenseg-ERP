import { createRouter, createWebHistory } from 'vue-router';
import Login from '../views/Login.vue';
import Dashboard from '../views/Dashboard.vue';
import Alumnos from '../views/Alumnos.vue';
import Cursos from '../views/Cursos.vue';
import Pagos from '../views/Pagos.vue';

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: Login },
  { path: '/dashboard', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/alumnos', component: Alumnos, meta: { requiresAuth: true } },
  { path: '/cursos', component: Cursos, meta: { requiresAuth: true } },
  { path: '/pagos', component: Pagos, meta: { requiresAuth: true } }
];

const router = createRouter({ history: createWebHistory(), routes });

// Guardia simple de sesión: sin token no se puede entrar a rutas privadas
router.beforeEach((to) => {
  const token = localStorage.getItem('prevenseg_token');
  if (to.meta.requiresAuth && !token) return '/login';
});

export default router;
