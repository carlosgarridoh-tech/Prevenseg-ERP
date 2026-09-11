<template>
  <div class="p-8">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-3xl font-bold text-primary-700">Cursos</h1>
        <p class="text-sm text-gray-500">Gestión de cursos y catálogo</p>
      </div>
      <button @click="nuevoCurso" class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm">+ Crear curso</button>
    </div>

    <div class="flex flex-wrap gap-3 mb-4">
      <select v-model="filtroEstado" class="border rounded-lg px-3 py-2 text-sm">
        <option value="">Todos los estados</option>
        <option value="activo">Activo</option>
        <option value="iniciado">Iniciado</option>
        <option value="terminado">Terminado</option>
      </select>
      <select v-model="filtroTipo" class="border rounded-lg px-3 py-2 text-sm">
        <option value="">Todos los tipos</option>
        <option v-for="t in tiposCurso" :key="t" :value="t">{{ t }}</option>
      </select>
    </div>

    <div class="flex gap-4 overflow-x-auto pb-2 mb-6">
      <button
        v-for="c in cursosFiltrados"
        :key="c.id"
        @click="seleccionado = c"
        class="text-left border rounded-xl p-4 min-w-[220px] flex-shrink-0"
        :class="seleccionado && seleccionado.id === c.id ? 'border-primary-500 ring-1 ring-primary-500' : 'border-gray-200'"
      >
        <div class="flex justify-between items-start mb-2">
          <span class="font-semibold text-primary-700">{{ c.nombre_curso }}</span>
          <span class="px-2 py-0.5 rounded-full text-xs" :class="badgeEstado(c.estado)">{{ c.estado }}</span>
        </div>
        <p class="text-xs text-gray-500">{{ c.tipo_curso }}</p>
        <p class="text-xs text-gray-400 mt-2">{{ formatearFecha(c.fecha_inicio) }} - {{ formatearFecha(c.fecha_termino) }}</p>
        <p class="text-xs text-gray-400">{{ c.alumnos ? c.alumnos.length : 0 }} / {{ c.cupos }} cupos - {{ c.horas_totales }} hrs</p>
      </button>
    </div>
    <p v-if="!cursosFiltrados.length" class="text-center text-gray-400 py-8">No hay cursos que coincidan con el filtro</p>

    <div v-if="seleccionado" class="bg-white rounded-xl shadow p-5">
      <div class="flex justify-between items-center mb-4">
        <h2 class="font-semibold text-primary-700">{{ seleccionado.tipo_curso }} - {{ seleccionado.nombre_curso }}</h2>
        <button @click="editar(seleccionado)" class="text-sm text-primary-600 hover:underline">Modificar</button>
      </div>

      <table class="w-full text-sm">
        <thead class="text-left text-gray-500">
          <tr><th class="py-1">Alumno</th><th>RUT</th><th>Empresa</th><th>Estado</th></tr>
        </thead>
        <tbody>
          <tr v-for="a in seleccionado.alumnos" :key="a.id" class="border-t">
            <td class="py-2">
              <div class="flex items-center gap-2">
                <AvatarBadge :nombre="a.nombres + ' ' + a.apellido_paterno" size="sm" />
                {{ a.nombres }} {{ a.apellido_paterno }}
              </div>
            </td>
            <td>{{ a.rut }}</td>
            <td>{{ a.tipo_empresa || '-' }}</td>
            <td><span class="px-2 py-0.5 rounded-full text-xs" :class="claseBadgeEstado(a.estado)">{{ a.estado }}</span></td>
          </tr>
          <tr v-if="!seleccionado.alumnos || !seleccionado.alumnos.length"><td colspan="4" class="text-center text-gray-400 py-6">Sin alumnos inscritos aún</td></tr>
        </tbody>
      </table>
    </div>

    <div v-if="mostrarModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <form @submit.prevent="guardar" class="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
        <h2 class="text-lg font-semibold text-primary-700 mb-4">{{ form.id ? 'Modificar' : 'Crear' }} curso</h2>
        <div class="grid grid-cols-2 gap-3">
          <input v-model="form.tipo_curso" placeholder="Tipo de curso" required class="border rounded-lg px-3 py-2" />
          <input v-model="form.nombre_curso" placeholder="Nombre del curso" required class="border rounded-lg px-3 py-2" />
          <input v-model.number="form.valor" type="number" placeholder="Valor" class="border rounded-lg px-3 py-2" />
          <input v-model.number="form.horas_totales" type="number" placeholder="Horas totales" class="border rounded-lg px-3 py-2" />
          <div>
            <label class="text-xs text-gray-500">Fecha inicio</label>
            <input v-model="form.fecha_inicio" type="date" required class="border rounded-lg px-3 py-2 w-full" />
          </div>
          <div>
            <label class="text-xs text-gray-500">Fecha término</label>
            <input v-model="form.fecha_termino" type="date" required class="border rounded-lg px-3 py-2 w-full" />
          </div>
          <input v-model.number="form.cupos" type="number" placeholder="Número de cupos" class="border rounded-lg px-3 py-2 col-span-2" />
        </div>
        <div class="flex justify-end gap-2 mt-5">
          <button type="button" @click="mostrarModal = false" class="px-4 py-2 rounded-lg text-gray-600">Cancelar</button>
          <button type="submit" class="px-4 py-2 rounded-lg bg-primary-600 text-white">Guardar</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import api from '../lib/api.js';
import { claseBadgeEstado } from '../lib/avatar.js';
import { formatearFecha } from '../lib/fecha.js';
import AvatarBadge from '../components/AvatarBadge.vue';

const cursos = ref([]);
const seleccionado = ref(null);
const mostrarModal = ref(false);
const form = ref({});
const filtroEstado = ref('');
const filtroTipo = ref('');

const tiposCurso = computed(() => [...new Set(cursos.value.map((c) => c.tipo_curso).filter(Boolean))]);

const cursosFiltrados = computed(() =>
  cursos.value.filter((c) => {
    if (filtroEstado.value && c.estado !== filtroEstado.value) return false;
    if (filtroTipo.value && c.tipo_curso !== filtroTipo.value) return false;
    return true;
  })
);

function badgeEstado(estado) {
  return { activo: 'bg-green-100 text-green-700', iniciado: 'bg-amber-100 text-amber-700', terminado: 'bg-gray-200 text-gray-600' }[estado];
}

async function cargarCursos() {
  const { data } = await api.get('/cursos');
  cursos.value = data;
  if (seleccionado.value) {
    seleccionado.value = data.find((c) => c.id === seleccionado.value.id) || null;
  } else if (data.length) {
    seleccionado.value = data[0];
  }
}

function nuevoCurso() {
  form.value = {};
  mostrarModal.value = true;
}

function editar(c) {
  form.value = { ...c, alumnos: undefined };
  mostrarModal.value = true;
}

async function guardar() {
  if (form.value.id) {
    await api.put(`/cursos/${form.value.id}`, form.value);
  } else {
    await api.post('/cursos', form.value);
  }
  mostrarModal.value = false;
  cargarCursos();
}

onMounted(cargarCursos);
</script>
