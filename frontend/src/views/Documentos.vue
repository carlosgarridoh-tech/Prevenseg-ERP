<template>
  <div class="p-8">
    <h1 class="text-3xl font-bold text-primary-700">Documentos</h1>
    <p class="text-sm text-gray-500 mb-6">Generación automática desde plantillas</p>

    <div class="bg-white rounded-xl shadow p-5 mb-6">
      <label class="text-sm text-gray-500">Curso</label>
      <select v-model="cursoId" @change="cargarAlumnos" class="block w-full max-w-sm border rounded-lg px-3 py-2 mt-1">
        <option disabled value="">Selecciona un curso</option>
        <option v-for="c in cursos" :key="c.id" :value="c.id">{{ c.nombre_curso }}</option>
      </select>
    </div>

    <div v-if="alumnos.length" class="bg-white rounded-xl shadow p-5 mb-6">
      <div class="flex justify-between items-center mb-3">
        <h2 class="font-semibold text-primary-700">Alumnos del curso</h2>
        <label class="text-sm text-gray-500 flex items-center gap-2">
          <input type="checkbox" @change="marcarTodos($event.target.checked)" /> Seleccionar todos
        </label>
      </div>
      <table class="w-full text-sm">
        <tbody>
          <tr v-for="a in alumnos" :key="a.id" class="border-t">
            <td class="py-2 w-8"><input type="checkbox" v-model="seleccionados" :value="a.id" /></td>
            <td class="py-2">
              <div class="flex items-center gap-2">
                <AvatarBadge :nombre="a.nombres + ' ' + a.apellido_paterno" size="sm" />
                {{ a.nombres }} {{ a.apellido_paterno }}
              </div>
            </td>
            <td class="py-2 text-gray-500">{{ a.rut }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="alumnos.length" class="bg-white rounded-xl shadow p-5 mb-6">
      <h2 class="font-semibold text-primary-700 mb-3">Tipo de documento</h2>
      <div class="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        <button
          v-for="t in tiposDocumento"
          :key="t.tipo"
          @click="tipoSeleccionado = t.tipo"
          class="border-2 rounded-xl p-4 text-sm text-center transition-all"
          :class="tipoSeleccionado === t.tipo ? 'border-primary-600 bg-primary-50 text-primary-700 shadow-md scale-105' : 'border-gray-200 hover:border-primary-300'"
        >
          <div class="mx-auto mb-2 w-9 h-9" v-html="t.icono"></div>
          <span class="font-medium">{{ t.label }}</span>
          <span v-if="!plantillaCargada(t.tipo)" class="block text-[10px] text-red-500 mt-1">Sin plantilla cargada</span>
        </button>
      </div>

      <button
        @click="generarDocumento"
        :disabled="!tipoSeleccionado || !seleccionados.length"
        class="bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white px-5 py-2.5 rounded-lg text-sm"
      >
        {{ `Generar documento (${seleccionados.length} alumno${seleccionados.length === 1 ? '' : 's'})` }}
      </button>
      <p v-if="errorGenerar" class="text-red-600 text-sm mt-2">{{ errorGenerar }}</p>
    </div>

    <div v-if="esAdmin" class="bg-white rounded-xl shadow p-5">
      <h2 class="font-semibold text-primary-700 mb-1">Cargar plantillas</h2>
      <p class="text-sm text-gray-500 mb-4">
        Sube el archivo base de cada tipo de documento. Usa <code>{nombre}</code>, <code>{rut}</code>, <code>{nombre_curso}</code>,
        <code>{fecha_inicio}</code>, <code>{fecha_termino}</code> dentro del archivo donde quieras que se reemplacen los datos.
      </p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-for="t in tiposDocumento" :key="t.tipo" class="border rounded-lg p-3">
          <p class="text-sm font-medium mb-1">{{ t.label }} <span class="text-gray-400 font-normal">({{ t.formato.toUpperCase() }})</span></p>
          <p v-if="plantillaCargada(t.tipo)" class="text-xs text-accent mb-2">Cargada: {{ plantillaCargada(t.tipo).nombre_original }}</p>
          <input type="file" :accept="t.formato === 'docx' ? '.docx' : '.xlsx'" @change="(e) => subirPlantilla(e, t.tipo)" class="text-xs" />
        </div>
      </div>
    </div>
    <!-- Documentos generales para alumnos (pruebas, informes, manuales) -->
    <div class="bg-white rounded-xl shadow p-5 mt-6">
      <h2 class="font-semibold text-primary-700 mb-1">Documentos para alumnos</h2>
      <p class="text-sm text-gray-500 mb-4">Sube pruebas, informes o manuales para que los alumnos los vean en su portal.</p>

      <form @submit.prevent="subirRecurso" class="flex flex-wrap gap-2 items-end mb-4">
        <div>
          <label class="text-xs text-gray-500">Curso (vacío = para todos)</label>
          <select v-model="nuevoRecurso.curso_id" class="block border rounded-lg px-3 py-2">
            <option :value="null">Todos los cursos</option>
            <option v-for="c in cursos" :key="c.id" :value="c.id">{{ c.nombre_curso }}</option>
          </select>
        </div>
        <div>
          <label class="text-xs text-gray-500">Categoría</label>
          <select v-model="nuevoRecurso.categoria" class="block border rounded-lg px-3 py-2">
            <option>Prueba</option>
            <option>Informe</option>
            <option>Manual</option>
            <option>Otro</option>
          </select>
        </div>
        <input type="file" @change="(e) => (nuevoRecurso.archivo = e.target.files[0])" class="text-sm" required />
        <button type="submit" class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm">Subir</button>
      </form>

      <table class="w-full text-sm">
        <thead class="text-left text-gray-500"><tr><th class="py-1">Archivo</th><th>Curso</th><th>Categoría</th><th></th></tr></thead>
        <tbody>
          <tr v-for="r in recursos" :key="r.id" class="border-t">
            <td class="py-2">{{ r.nombre_original }}</td>
            <td>{{ r.cursos ? r.cursos.nombre_curso : 'Todos' }}</td>
            <td>{{ r.categoria }}</td>
            <td><button @click="eliminarRecurso(r)" class="text-red-600 hover:underline">Eliminar</button></td>
          </tr>
          <tr v-if="!recursos.length"><td colspan="4" class="text-center text-gray-400 py-4">Sin documentos subidos</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../lib/api.js';
import AvatarBadge from '../components/AvatarBadge.vue';
import { iniciarTrabajo } from '../lib/trabajos.js';

const ICONO = {
  spd: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3h9l5 5v13H6z"/><path d="M15 3v5h5"/><path d="M9 13h6M9 17h6M9 9h2"/></svg>',
  os10: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3h9l5 5v13H6z"/><path d="M15 3v5h5"/><circle cx="12" cy="14" r="3"/></svg>',
  certificado: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="9" r="5"/><path d="M9 13.5L7 21l5-3 5 3-2-7.5"/></svg>',
  alumno_regular: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="4" y="4" width="16" height="16" rx="2"/><circle cx="10" cy="10" r="2.2"/><path d="M6.5 17c.5-2.2 2-3.3 3.5-3.3s3 1.1 3.5 3.3M15 9h3M15 13h3"/></svg>',
  cotizacion: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="8"/><path d="M12 7.5v9M15 9.8c0-1.3-1.3-2.3-3-2.3s-3 1-3 2.2 1.3 1.8 3 2.1 3 .9 3 2.2-1.3 2.3-3 2.3-3-1-3-2.3"/></svg>'
};

const tiposDocumento = [
  { tipo: 'spd', label: 'Inicio/Término SPD', formato: 'xlsx', icono: ICONO.spd },
  { tipo: 'os10', label: 'Inicio/Término OS10', formato: 'xlsx', icono: ICONO.os10 },
  { tipo: 'certificado', label: 'Certificado aprobación', formato: 'docx', icono: ICONO.certificado },
  { tipo: 'alumno_regular', label: 'Alumno regular', formato: 'docx', icono: ICONO.alumno_regular },
  { tipo: 'cotizacion', label: 'Cotización', formato: 'docx', icono: ICONO.cotizacion }
];

const cursos = ref([]);
const alumnos = ref([]);
const cursoId = ref('');
const seleccionados = ref([]);
const tipoSeleccionado = ref('');
const plantillas = ref([]);
const errorGenerar = ref('');
const recursos = ref([]);
const nuevoRecurso = ref({ curso_id: null, categoria: 'Prueba', archivo: null });

const usuario = JSON.parse(localStorage.getItem('prevenseg_usuario') || '{}');
const esAdmin = usuario.rol === 'administrador';

function plantillaCargada(tipo) {
  return plantillas.value.find((p) => p.tipo === tipo);
}

async function cargarAlumnos() {
  const { data } = await api.get('/cursos/' + cursoId.value);
  alumnos.value = data.alumnos || [];
  seleccionados.value = [];
}

function marcarTodos(checked) {
  seleccionados.value = checked ? alumnos.value.map((a) => a.id) : [];
}

async function cargarPlantillas() {
  const { data } = await api.get('/documentos/plantillas');
  plantillas.value = data;
}

async function cargarRecursos() {
  const { data } = await api.get('/documentos/recursos');
  recursos.value = data;
}

async function subirRecurso() {
  const formData = new FormData();
  formData.append('archivo', nuevoRecurso.value.archivo);
  formData.append('categoria', nuevoRecurso.value.categoria);
  if (nuevoRecurso.value.curso_id) formData.append('curso_id', nuevoRecurso.value.curso_id);
  await api.post('/documentos/recursos', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  nuevoRecurso.value = { curso_id: null, categoria: 'Prueba', archivo: null };
  cargarRecursos();
}

async function eliminarRecurso(r) {
  if (!confirm(`¿Eliminar "${r.nombre_original}"?`)) return;
  await api.delete(`/documentos/recursos/${r.id}`);
  cargarRecursos();
}

async function subirPlantilla(evento, tipo) {
  const archivo = evento.target.files[0];
  if (!archivo) return;
  const formData = new FormData();
  formData.append('archivo', archivo);
  formData.append('tipo', tipo);
  await api.post('/documentos/plantillas', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  cargarPlantillas();
}

async function generarDocumento() {
  errorGenerar.value = '';
  try {
    const { data } = await api.post('/documentos/generar', {
      tipo: tipoSeleccionado.value,
      curso_id: cursoId.value,
      alumno_ids: seleccionados.value
    });
    const etiqueta = tiposDocumento.find((t) => t.tipo === tipoSeleccionado.value)?.label || 'Documento';
    iniciarTrabajo(data.jobId, `Generando: ${etiqueta}`, data.total);
  } catch (e) {
    errorGenerar.value = e.response?.data?.error || 'No se pudo iniciar la generación. Revisa que la plantilla esté cargada.';
  }
}

onMounted(async () => {
  const { data } = await api.get('/cursos');
  cursos.value = data;
  cargarPlantillas();
  cargarRecursos();
});
</script>
