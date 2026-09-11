<template>
  <aside class="w-56 flex-shrink-0 bg-white border-r h-screen sticky top-0 flex flex-col">
    <div class="flex items-center gap-2 px-5 py-5 border-b">
      <img src="../assets/logo.png" alt="Prevenseg" class="h-8" />
    </div>

    <nav class="flex-1 overflow-y-auto py-3">
      <router-link
        v-for="item in items"
        :key="item.ruta"
        :to="item.ruta"
        class="flex items-center gap-3 px-5 py-2.5 text-sm font-medium mx-2 rounded-lg mb-0.5"
        :class="esActivo(item.ruta) ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'"
      >
        <component :is="item.icono" class="w-5 h-5 flex-shrink-0" />
        {{ item.label }}
      </router-link>
    </nav>
  </aside>
</template>

<script setup>
import { h } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
function esActivo(ruta) {
  return route.path === ruta;
}

const svg = (children) => (props) =>
  h(
    'svg',
    { viewBox: '0 0 20 20', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...props },
    children
  );

const IconoDashboard = svg([
  h('rect', { x: 3, y: 3, width: 6, height: 6, rx: 1 }),
  h('rect', { x: 11, y: 3, width: 6, height: 6, rx: 1 }),
  h('rect', { x: 3, y: 11, width: 6, height: 6, rx: 1 }),
  h('rect', { x: 11, y: 11, width: 6, height: 6, rx: 1 })
]);
const IconoAlumnos = svg([h('circle', { cx: 10, cy: 7, r: 3 }), h('path', { d: 'M4 18c0-3.3 2.7-6 6-6s6 2.7 6 6' })]);
const IconoPagos = svg([
  h('circle', { cx: 10, cy: 10, r: 7 }),
  h('path', { d: 'M10 6.5v7M12.5 8.2c0-1-1-1.7-2.5-1.7s-2.5.7-2.5 1.7 1 1.4 2.5 1.6 2.5.7 2.5 1.7-1 1.7-2.5 1.7-2.5-.7-2.5-1.7' })
]);
const IconoCursos = svg([h('rect', { x: 4, y: 3, width: 12, height: 14, rx: 1 }), h('line', { x1: 10, y1: 3, x2: 10, y2: 17 })]);
const IconoHorarios = svg([
  h('rect', { x: 3, y: 4, width: 14, height: 13, rx: 1 }),
  h('line', { x1: 3, y1: 8, x2: 17, y2: 8 }),
  h('line', { x1: 7, y1: 2, x2: 7, y2: 5 }),
  h('line', { x1: 13, y1: 2, x2: 13, y2: 5 })
]);
const IconoRelatores = svg([
  h('circle', { cx: 7, cy: 7, r: 2.5 }),
  h('circle', { cx: 14, cy: 8, r: 2 }),
  h('path', { d: 'M2.5 17c0-2.8 2-5 4.5-5s4.5 2.2 4.5 5' }),
  h('path', { d: 'M12.5 17c0-1.8 1-3.4 2.5-4.2' })
]);
const IconoNotificaciones = svg([
  h('path', { d: 'M6 8a4 4 0 018 0v3.5c0 1 .4 1.8 1.2 2.5H4.8C5.6 13.3 6 12.5 6 11.5V8z' }),
  h('path', { d: 'M8.2 16.5a1.8 1.8 0 003.6 0' })
]);
const IconoDocumentos = svg([h('path', { d: 'M5 2.5h6l4 4v11H5z' }), h('path', { d: 'M11 2.5v4h4' })]);
const IconoReportes = svg([
  h('rect', { x: 3.5, y: 10, width: 3, height: 7, rx: 0.5 }),
  h('rect', { x: 8.5, y: 5.5, width: 3, height: 11.5, rx: 0.5 }),
  h('rect', { x: 13.5, y: 12.5, width: 3, height: 4.5, rx: 0.5 })
]);
const IconoAjustes = svg([
  h('line', { x1: 3, y1: 6, x2: 17, y2: 6 }),
  h('circle', { cx: 12, cy: 6, r: 1.6, fill: 'currentColor' }),
  h('line', { x1: 3, y1: 10.5, x2: 17, y2: 10.5 }),
  h('circle', { cx: 7, cy: 10.5, r: 1.6, fill: 'currentColor' }),
  h('line', { x1: 3, y1: 15, x2: 17, y2: 15 }),
  h('circle', { cx: 13.5, cy: 15, r: 1.6, fill: 'currentColor' })
]);

const items = [
  { ruta: '/dashboard', label: 'Dashboard', icono: IconoDashboard },
  { ruta: '/alumnos', label: 'Alumnos', icono: IconoAlumnos },
  { ruta: '/pagos', label: 'Pagos', icono: IconoPagos },
  { ruta: '/cursos', label: 'Cursos', icono: IconoCursos },
  { ruta: '/horarios', label: 'Horarios', icono: IconoHorarios },
  { ruta: '/relatores', label: 'Relatores', icono: IconoRelatores },
  { ruta: '/notificaciones', label: 'Notificaciones', icono: IconoNotificaciones },
  { ruta: '/documentos', label: 'Documentos', icono: IconoDocumentos },
  { ruta: '/reportes', label: 'Reportes', icono: IconoReportes },
  { ruta: '/ajustes', label: 'Ajustes', icono: IconoAjustes }
];
</script>
