<template>
  <div class="p-8">
    <h1 class="text-3xl font-bold text-primary-700 mb-1">Bienvenido, {{ usuario.nombre || usuario.email }}</h1>
    <p class="text-gray-500 mb-6">Resumen de la operación - rol: {{ usuario.rol }}</p>

    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-xl shadow p-5 border-l-4 border-primary-500">
        <p class="text-sm text-gray-500">Alumnos totales</p>
        <p class="text-3xl font-bold text-primary-700">{{ alumnos.length }}</p>
      </div>
      <div class="bg-white rounded-xl shadow p-5 border-l-4 border-green-500">
        <p class="text-sm text-gray-500">Cursos activos</p>
        <p class="text-3xl font-bold text-primary-700">{{ cursosActivos }}</p>
      </div>
      <div class="bg-white rounded-xl shadow p-5 border-l-4 border-amber-500">
        <p class="text-sm text-gray-500">Ingresos recibidos</p>
        <p class="text-3xl font-bold text-primary-700">${{ ingresosTotales.toLocaleString('es-CL') }}</p>
      </div>
      <div class="bg-white rounded-xl shadow p-5 border-l-4 border-red-500">
        <p class="text-sm text-gray-500">Alumnos morosos</p>
        <p class="text-3xl font-bold text-red-600">{{ conteoFinanciero['Moroso'] || 0 }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <div class="bg-white rounded-xl shadow p-5">
        <h2 class="font-semibold text-primary-700 mb-3">Estado de pagos</h2>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between items-center">
            <span class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full bg-green-500"></span>Al día</span>
            <span class="font-medium">{{ conteoFinanciero['Al día'] || 0 }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>Pago pendiente</span>
            <span class="font-medium">{{ conteoFinanciero['Pago pendiente'] || 0 }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full bg-red-500"></span>Moroso</span>
            <span class="font-medium">{{ conteoFinanciero['Moroso'] || 0 }}</span>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow p-5">
        <h2 class="font-semibold text-primary-700 mb-3">Alumnos por tipo de empresa</h2>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between"><span>Particular</span><span class="font-medium">{{ conteoEmpresa['Particular'] || 0 }}</span></div>
          <div class="flex justify-between"><span>Sence</span><span class="font-medium">{{ conteoEmpresa['Sence'] || 0 }}</span></div>
          <div class="flex justify-between"><span>No sence</span><span class="font-medium">{{ conteoEmpresa['No sence'] || 0 }}</span></div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow p-5">
        <h2 class="font-semibold text-primary-700 mb-1">Relatores</h2>
        <p class="text-xs text-gray-400 mb-3">Monto a pagar según horas asignadas</p>
        <div class="space-y-2 text-sm max-h-32 overflow-y-auto">
          <div v-for="r in relatores" :key="r.id" class="flex justify-between">
            <span>{{ r.nombre }}</span>
            <span class="font-medium">${{ r.total_a_pagar.toLocaleString('es-CL') }}</span>
          </div>
          <p v-if="!relatores.length" class="text-gray-400 text-xs">Sin relatores registrados</p>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow p-5">
      <h2 class="font-semibold text-primary-700 mb-3">Cursos</h2>
      <table class="w-full text-sm">
        <thead class="text-left text-gray-500">
          <tr><th class="py-1">Curso</th><th>Tipo</th><th>Fechas</th><th>Alumnos</th><th>Estado</th></tr>
        </thead>
        <tbody>
          <tr v-for="c in cursos" :key="c.id" class="border-t">
            <td class="py-2 font-medium text-primary-700">{{ c.nombre_curso }}</td>
            <td>{{ c.tipo_curso }}</td>
            <td class="text-gray-500">{{ formatearFecha(c.fecha_inicio) }} - {{ formatearFecha(c.fecha_termino) }}</td>
            <td>{{ c.alumnos ? c.alumnos.length : 0 }} / {{ c.cupos }}</td>
            <td><span class="px-2 py-0.5 rounded-full text-xs" :class="badgeEstadoCurso(c.estado)">{{ c.estado }}</span></td>
          </tr>
          <tr v-if="!cursos.length"><td colspan="5" class="text-center text-gray-400 py-6">Sin cursos creados</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../lib/api.js';
import { estadoFinancieroAlumno } from '../lib/finanzas.js';
import { formatearFecha } from '../lib/fecha.js';

const usuario = ref(JSON.parse(localStorage.getItem('prevenseg_usuario') || '{}'));
const alumnos = ref([]);
const cursos = ref([]);
const relatores = ref([]);

const cursosActivos = computed(() => cursos.value.filter((c) => c.estado === 'activo').length);

const ingresosTotales = computed(() =>
  alumnos.value.reduce((acc, a) => acc + (a.pagos || []).filter((p) => !p.anulado).reduce((s, p) => s + Number(p.monto), 0), 0)
);

const conteoFinanciero = computed(() => {
  const conteo = {};
  alumnos.value.forEach((a) => {
    const estado = estadoFinancieroAlumno(a);
    if (estado) conteo[estado] = (conteo[estado] || 0) + 1;
  });
  return conteo;
});

const conteoEmpresa = computed(() => {
  const conteo = {};
  alumnos.value.forEach((a) => {
    if (a.tipo_empresa) conteo[a.tipo_empresa] = (conteo[a.tipo_empresa] || 0) + 1;
  });
  return conteo;
});

function badgeEstadoCurso(estado) {
  return { activo: 'bg-green-100 text-green-700', iniciado: 'bg-amber-100 text-amber-700', terminado: 'bg-gray-200 text-gray-600' }[estado];
}

onMounted(async () => {
  const [a, c, r] = await Promise.all([api.get('/alumnos'), api.get('/cursos'), api.get('/relatores')]);
  alumnos.value = a.data;
  cursos.value = c.data;
  relatores.value = r.data;
});
</script>
