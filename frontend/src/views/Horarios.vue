<template>
  <div class="p-8">
    <div class="flex items-center justify-between mb-1 print:hidden">
      <div>
        <h1 class="text-3xl font-bold text-primary-700">Horarios</h1>
        <p class="text-sm text-gray-500">Calendario del curso</p>
      </div>
      <div class="flex gap-2">
        <button @click="imprimir" class="bg-white border border-primary-500 text-primary-600 px-4 py-2 rounded-lg text-sm">Imprimir</button>
        <button @click="exportarExcel" :disabled="!cursoId" class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-40">
          Exportar a Excel
        </button>
      </div>
    </div>

    <div class="flex flex-wrap items-end gap-3 my-4 print:hidden">
      <div>
        <label class="text-sm text-gray-500">Curso</label>
        <select v-model="cursoId" @change="cargarBloques" class="block w-64 border rounded-lg px-3 py-2 mt-1">
          <option disabled value="">Selecciona un curso</option>
          <option v-for="c in cursos" :key="c.id" :value="c.id">{{ c.nombre_curso }}</option>
        </select>
      </div>
      <div v-if="cursoId" class="flex items-end gap-2">
        <button @click="generarDiasDelCurso" class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm">
          Generar días del curso
        </button>
        <div>
          <label class="text-sm text-gray-500">Agregar 1 día (contingencia)</label>
          <input v-model="nuevaFecha" type="date" class="block border rounded-lg px-3 py-2 mt-1" />
        </div>
        <button @click="agregarDia" class="bg-accent hover:opacity-90 text-white px-4 py-2 rounded-lg text-sm">+ Agregar</button>
      </div>
      <div v-if="cursoId" class="flex items-end gap-2">
        <div>
          <label class="text-sm text-gray-500">Hora inicio del calendario</label>
          <select v-model.number="horaInicio" class="block w-28 border rounded-lg px-3 py-2 mt-1">
            <option v-for="h in 23" :key="h - 1" :value="h - 1">{{ String(h - 1).padStart(2, '0') }}:00</option>
          </select>
        </div>
        <div>
          <label class="text-sm text-gray-500">Hora término</label>
          <select v-model.number="horaFin" class="block w-28 border rounded-lg px-3 py-2 mt-1">
            <option v-for="h in 23" :key="h" :value="h">{{ String(h).padStart(2, '0') }}:00</option>
          </select>
        </div>
      </div>
    </div>

    <p v-if="cursoId" class="text-xs text-gray-400 mb-2 print:hidden">Haz clic en un espacio vacío para crear un bloque, o sobre uno existente para modificarlo.</p>

    <div v-if="cursoId" class="bg-white rounded-xl shadow overflow-x-auto">
      <div class="flex" style="min-width: max-content">
        <div class="w-14 flex-shrink-0 relative border-r" :style="{ height: alturaTotal + 'px' }">
          <div v-for="h in marcasHora" :key="h" class="absolute left-0 right-0 text-[10px] text-gray-400 -mt-2 text-right pr-1"
               :style="{ top: minutosAPx((h - horaInicio) * 60) + ALTO_ENCABEZADO + 'px' }">
            {{ String(h).padStart(2, '0') }}:00
          </div>
        </div>

        <div v-for="d in dias" :key="d" class="border-r relative flex-shrink-0" style="width: 190px" :style="{ height: alturaTotal + 'px' }">
          <div class="text-center bg-primary-50 py-1 border-b leading-tight px-1" :style="{ height: ALTO_ENCABEZADO + 'px' }">
            <p class="text-xs font-bold text-primary-700 uppercase">{{ nombreDia(d) }}</p>
            <p class="text-[11px] text-gray-500">{{ fechaCorta(d) }}</p>
          </div>
          <div
            v-for="h in marcasHora"
            :key="h"
            class="absolute left-0 right-0 border-t border-gray-100"
            :style="{ top: minutosAPx((h - horaInicio) * 60) + ALTO_ENCABEZADO + 'px' }"
          ></div>

          <div class="absolute inset-x-0 bottom-0" :style="{ top: ALTO_ENCABEZADO + 'px' }" @click="crearDesdeClick(d, $event)"></div>

          <div
            v-for="b in bloquesDelDia(d)"
            :key="b.id"
            @click.stop="abrirEditar(b)"
            class="absolute left-0.5 right-0.5 rounded px-1.5 py-1 text-white text-[11px] cursor-pointer overflow-hidden shadow-sm hover:brightness-95"
            :style="{ top: minutosAPx(toMin(b.hora_inicio) - horaInicio * 60) + ALTO_ENCABEZADO + 'px', height: Math.max(minutosAPx(toMin(b.hora_fin) - toMin(b.hora_inicio)), 18) + 'px', backgroundColor: b.color }"
          >
            <p class="font-medium leading-tight truncate">{{ b.titulo }}</p>
            <p class="opacity-90 leading-tight truncate">{{ b.hora_inicio.slice(0,5) }}-{{ b.hora_fin.slice(0,5) }}</p>
            <p v-if="b.relatores" class="opacity-80 leading-tight truncate">{{ b.relatores.nombre }}</p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="mostrarModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 print:hidden">
      <form @submit.prevent="guardarBloque" class="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
        <h2 class="text-lg font-semibold text-primary-700 mb-4">{{ form.id ? 'Modificar bloque' : 'Nuevo bloque' }}</h2>

        <label class="text-xs text-gray-500">Día</label>
        <input v-model="form.fecha" type="date" required class="w-full border rounded-lg px-3 py-2 mb-3" />

        <div class="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label class="text-xs text-gray-500">Hora inicio</label>
            <input v-model="form.hora_inicio" type="time" required class="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label class="text-xs text-gray-500">Hora término</label>
            <input v-model="form.hora_fin" type="time" required class="w-full border rounded-lg px-3 py-2" />
          </div>
        </div>

        <label class="text-xs text-gray-500">Tipo de bloque</label>
        <select v-model="form.tipo" @change="aplicarColorPorTipo" class="w-full border rounded-lg px-3 py-2 mb-3">
          <option value="clase">Clase / Asignatura</option>
          <option value="almuerzo">Almuerzo</option>
          <option value="descanso">Descanso</option>
          <option value="libre">Bloque libre</option>
        </select>

        <template v-if="form.tipo === 'clase'">
          <label class="text-xs text-gray-500">Asignatura</label>
          <select v-model="seleccionAsignatura" @change="alSeleccionarAsignatura" class="w-full border rounded-lg px-3 py-2 mb-3">
            <option v-for="nombre in Object.keys(colorPorAsignatura)" :key="nombre" :value="nombre">{{ nombre }}</option>
            <option value="__nueva__">+ Nueva actividad...</option>
          </select>
          <input v-if="seleccionAsignatura === '__nueva__'" v-model="form.titulo" required placeholder="Nombre de la actividad o tarea" class="w-full border rounded-lg px-3 py-2 mb-3" />

          <label class="text-xs text-gray-500">Relator</label>
          <select v-model="form.relator_id" class="w-full border rounded-lg px-3 py-2 mb-3">
            <option :value="null">Sin asignar</option>
            <option v-for="r in relatoresDisponibles" :key="r.id" :value="r.id">{{ r.nombre }}</option>
          </select>
          <p v-if="relatoresDisponibles.length < relatores.length" class="text-xs text-gray-400 -mt-2 mb-3">
            Mostrando relatores de "{{ seleccionAsignatura }}". <button type="button" @click="mostrarTodosLosRelatores = true" class="text-primary-600 hover:underline">Ver todos</button>
          </p>
        </template>
        <input v-else v-model="form.titulo" readonly class="w-full border rounded-lg px-3 py-2 mb-3 bg-gray-50 text-gray-500" />

        <label class="text-xs text-gray-500">Color</label>
        <input v-model="form.color" type="color" class="w-full h-9 border rounded-lg mb-4" />

        <p v-if="error" class="text-red-600 text-xs mb-3">{{ error }}</p>

        <div class="flex justify-between items-center">
          <button v-if="form.id" type="button" @click="eliminarBloque" class="text-red-600 text-sm hover:underline">Eliminar</button>
          <div class="flex gap-2 ml-auto">
            <button type="button" @click="mostrarModal = false" class="px-4 py-2 rounded-lg text-gray-600">Cancelar</button>
            <button type="submit" class="px-4 py-2 rounded-lg bg-primary-600 text-white">Guardar</button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../lib/api.js';

const horaInicio = ref(7);
const horaFin = ref(20);
const PX_POR_HORA = 50;
const ALTO_ENCABEZADO = 44;
const marcasHora = computed(() => Array.from({ length: horaFin.value - horaInicio.value + 1 }, (_, i) => horaInicio.value + i));
const alturaTotal = computed(() => (horaFin.value - horaInicio.value) * PX_POR_HORA + ALTO_ENCABEZADO);

const colorPorTipo = { clase: '#a01f27', almuerzo: '#9ca3af', descanso: '#d1d5db', libre: '#3d8f5f' };

const cursos = ref([]);
const relatores = ref([]);
const cursoId = ref('');
const bloques = ref([]);
const diasExtra = ref([]);
const nuevaFecha = ref('');
const mostrarModal = ref(false);
const form = ref({});
const seleccionAsignatura = ref('');
const mostrarTodosLosRelatores = ref(false);

const relatoresDisponibles = computed(() => {
  if (mostrarTodosLosRelatores.value || seleccionAsignatura.value === '__nueva__' || !seleccionAsignatura.value) return relatores.value;
  const coinciden = relatores.value.filter((r) => (r.asignatura || '').trim().toLowerCase() === seleccionAsignatura.value.trim().toLowerCase());
  return coinciden.length ? coinciden : relatores.value;
});
const error = ref('');

const dias = computed(() => {
  const fechas = new Set([...bloques.value.map((b) => b.fecha), ...diasExtra.value]);
  return [...fechas].filter(Boolean).sort();
});

const colorPorAsignatura = computed(() => {
  const mapa = {};
  bloques.value.forEach((b) => {
    if (b.tipo === 'clase') mapa[b.titulo] = b.color;
  });
  return mapa;
});

function nombreDia(fechaStr) {
  const fecha = new Date(fechaStr + 'T00:00:00');
  return fecha.toLocaleDateString('es-CL', { weekday: 'long' });
}

function fechaCorta(fechaStr) {
  const fecha = new Date(fechaStr + 'T00:00:00');
  return fecha.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' });
}

function toMin(horaStr) {
  const [h, m] = horaStr.split(':').map(Number);
  return h * 60 + m;
}
function minutosAPx(min) {
  return (min / 60) * PX_POR_HORA;
}
function bloquesDelDia(fecha) {
  return bloques.value.filter((b) => b.fecha === fecha);
}

async function cargarBloques() {
  if (!cursoId.value) return;
  const { data } = await api.get(`/horarios/curso/${cursoId.value}`);
  bloques.value = data;
}

function agregarDia() {
  if (!nuevaFecha.value) return;
  if (!diasExtra.value.includes(nuevaFecha.value)) diasExtra.value.push(nuevaFecha.value);
  nuevaFecha.value = '';
}

function generarDiasDelCurso() {
  const curso = cursos.value.find((c) => c.id === cursoId.value);
  if (!curso?.fecha_inicio || !curso?.fecha_termino) return;

  const inicio = new Date(curso.fecha_inicio + 'T00:00:00');
  const termino = new Date(curso.fecha_termino + 'T00:00:00');
  const nuevos = [];

  for (let f = new Date(inicio); f <= termino; f.setDate(f.getDate() + 1)) {
    nuevos.push(f.toISOString().slice(0, 10));
  }

  nuevos.forEach((f) => {
    if (!diasExtra.value.includes(f)) diasExtra.value.push(f);
  });
}

function crearDesdeClick(fecha, evento) {
  const y = evento.offsetY;
  let minutos = Math.round(y / PX_POR_HORA / 0.25) * 15 + horaInicio.value * 60;
  minutos = Math.max(horaInicio.value * 60, Math.min(minutos, horaFin.value * 60 - 30));
  const horaInicioStr = `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`;
  const finMin = Math.min(minutos + 60, horaFin.value * 60);
  const horaFinStr = `${String(Math.floor(finMin / 60)).padStart(2, '0')}:${String(finMin % 60).padStart(2, '0')}`;

  error.value = '';
  form.value = { curso_id: cursoId.value, fecha, hora_inicio: horaInicioStr, hora_fin: horaFinStr, tipo: 'clase', color: colorPorTipo.clase, relator_id: null, titulo: '' };
  seleccionAsignatura.value = Object.keys(colorPorAsignatura.value)[0] || '__nueva__';
  alSeleccionarAsignatura();
  mostrarModal.value = true;
}

function abrirEditar(b) {
  error.value = '';
  form.value = { ...b, hora_inicio: b.hora_inicio.slice(0, 5), hora_fin: b.hora_fin.slice(0, 5), relatores: undefined };
  mostrarTodosLosRelatores.value = true;
  if (b.tipo === 'clase') {
    seleccionAsignatura.value = colorPorAsignatura.value[b.titulo] !== undefined ? b.titulo : '__nueva__';
  }
  mostrarModal.value = true;
}

function aplicarColorPorTipo() {
  form.value.color = colorPorTipo[form.value.tipo];
  if (form.value.tipo !== 'clase') {
    form.value.titulo = { almuerzo: 'Almuerzo', descanso: 'Descanso', libre: 'Bloque libre' }[form.value.tipo];
  } else {
    seleccionAsignatura.value = Object.keys(colorPorAsignatura.value)[0] || '__nueva__';
    alSeleccionarAsignatura();
  }
}

function alSeleccionarAsignatura() {
  mostrarTodosLosRelatores.value = false;
  form.value.relator_id = null;
  if (seleccionAsignatura.value === '__nueva__') {
    form.value.titulo = '';
  } else {
    form.value.titulo = seleccionAsignatura.value;
    form.value.color = colorPorAsignatura.value[seleccionAsignatura.value] || form.value.color;
  }
}

async function guardarBloque() {
  error.value = '';
  try {
    if (form.value.id) {
      await api.put(`/horarios/${form.value.id}`, form.value);
    } else {
      await api.post('/horarios', form.value);
    }
    mostrarModal.value = false;
    cargarBloques();
  } catch (e) {
    error.value = e.response?.data?.error || 'No se pudo guardar el bloque';
  }
}

async function eliminarBloque() {
  if (!confirm(`¿Eliminar "${form.value.titulo}"?`)) return;
  await api.delete(`/horarios/${form.value.id}`);
  mostrarModal.value = false;
  cargarBloques();
}

function imprimir() {
  window.print();
}

async function exportarExcel() {
  window.open(`${api.defaults.baseURL}/horarios/curso/${cursoId.value}/exportar`, '_blank');
}

onMounted(async () => {
  const [c, r] = await Promise.all([api.get('/cursos'), api.get('/relatores')]);
  cursos.value = c.data;
  relatores.value = r.data;
});
</script>
