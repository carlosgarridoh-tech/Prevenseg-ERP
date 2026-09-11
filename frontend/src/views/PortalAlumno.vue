<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white border-b px-6 py-3 flex items-center justify-between">
      <img src="../assets/logo.png" alt="Prevenseg" class="h-8" />
      <div class="flex items-center gap-3">
        <span class="text-sm text-gray-600">{{ misDatos?.nombres }} {{ misDatos?.apellido_paterno }}</span>
        <button @click="salir" class="text-sm text-primary-600 hover:underline">Cerrar sesión</button>
      </div>
    </header>

    <div class="max-w-4xl mx-auto p-6">
      <h1 class="text-2xl font-bold text-primary-700 mb-1">Portal del Alumno</h1>
      <p class="text-gray-500 mb-4" v-if="misDatos?.cursos">{{ misDatos.cursos.nombre_curso }}</p>

      <p v-if="errorCarga" class="bg-red-50 text-red-700 text-sm rounded-lg p-4 mb-4">{{ errorCarga }}</p>

      <!-- Avisos del administrador -->
      <div v-for="a in avisos" :key="a.id" class="rounded-lg p-4 mb-3" :class="a.nivel === 'advertencia' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-primary-50 text-primary-700'">
        <p class="text-base font-medium">{{ a.mensaje }}</p>
        <p class="text-xs opacity-70 mt-1">{{ new Date(a.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' }) }}</p>
      </div>

      <div class="flex gap-2 mb-6 mt-4">
        <button
          v-for="t in tabs"
          :key="t"
          @click="tab = t"
          class="px-4 py-2 rounded-lg text-sm border"
          :class="tab === t ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 text-gray-600'"
        >
          {{ t }}
        </button>
      </div>

      <div v-if="tab === 'Mis datos'" class="bg-white rounded-xl shadow p-5">
        <p><b>Nombre:</b> {{ misDatos?.nombres }} {{ misDatos?.apellido_paterno }} {{ misDatos?.apellido_materno }}</p>
        <p><b>RUT:</b> {{ misDatos?.rut }}</p>
        <p><b>Correo:</b> {{ misDatos?.correo }}</p>
        <p><b>Curso:</b> {{ misDatos?.cursos ? misDatos.cursos.nombre_curso : 'Sin curso asignado' }}</p>
        <p v-if="misDatos?.cursos"><b>Fechas:</b> {{ misDatos.cursos.fecha_inicio }} al {{ misDatos.cursos.fecha_termino }}</p>
        <p><b>Estado:</b> {{ misDatos?.estado }}</p>
        <p v-if="misDatos?.estadoFinanciero">
          <b>Estado de pago:</b>
          <span class="px-2 py-0.5 rounded-full text-xs ml-1" :class="claseEstadoPago(misDatos.estadoFinanciero)">{{ misDatos.estadoFinanciero }}</span>
        </p>
        <p v-if="misDatos?.saldoPendiente > 0" class="text-red-600 text-sm mt-1">Saldo pendiente: ${{ misDatos.saldoPendiente.toLocaleString('es-CL') }}</p>
      </div>

      <div v-if="tab === 'Mi horario'" class="bg-white rounded-xl shadow p-5">
        <table class="w-full text-sm" v-if="horario.length">
          <thead class="text-left text-gray-500"><tr><th class="py-1">Fecha</th><th>Hora</th><th>Actividad</th><th>Relator</th></tr></thead>
          <tbody>
            <tr v-for="b in horario" :key="b.id" class="border-t">
              <td class="py-2">{{ b.fecha }}</td>
              <td>{{ b.hora_inicio.slice(0,5) }} - {{ b.hora_fin.slice(0,5) }}</td>
              <td><span class="px-2 py-0.5 rounded text-xs text-white" :style="{ backgroundColor: b.color }">{{ b.titulo }}</span></td>
              <td>{{ b.relatores ? b.relatores.nombre : '-' }}</td>
            </tr>
          </tbody>
        </table>
        <p v-else class="text-gray-400 text-center py-6">Aún no hay horario publicado para tu curso</p>
      </div>

      <div v-if="tab === 'Documentos'" class="bg-white rounded-xl shadow p-5">
        <h3 class="text-sm font-medium text-gray-600 mb-2">Documentos disponibles</h3>
        <ul class="divide-y">
          <li v-for="r in recursos" :key="r.id" class="py-2 flex items-center justify-between text-sm">
            <span>{{ r.nombre_original }} <span class="text-gray-400">({{ r.categoria }})</span></span>
            <button @click="descargarRecurso(r)" class="text-primary-600 hover:underline">Descargar</button>
          </li>
          <li v-if="!recursos.length" class="text-gray-400 text-center py-4">Sin documentos disponibles por ahora</li>
        </ul>
      </div>

      <div v-if="tab === 'Comentarios'" class="bg-white rounded-xl shadow p-5">
        <form @submit.prevent="enviarComentario" class="flex gap-2 mb-4">
          <input v-model="nuevoComentario" placeholder="Escribe una consulta o comentario sobre el curso..." class="flex-1 border rounded-lg px-3 py-2" />
          <button type="submit" class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm">Enviar</button>
        </form>
        <div class="space-y-3">
          <div v-for="c in comentarios" :key="c.id" class="border-t pt-3">
            <p class="text-sm font-medium text-primary-700">{{ c.alumnos ? c.alumnos.nombres : '' }} {{ c.alumnos ? c.alumnos.apellido_paterno : '' }}</p>
            <p class="text-sm text-gray-600">{{ c.mensaje }}</p>
            <p class="text-xs text-gray-400">{{ new Date(c.created_at).toLocaleString('es-CL') }}</p>
          </div>
          <p v-if="!comentarios.length" class="text-gray-400 text-center py-6">Aún no hay comentarios en este curso</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '../lib/api.js';

const router = useRouter();
const tabs = ['Mis datos', 'Mi horario', 'Documentos', 'Comentarios'];
const tab = ref('Mis datos');

const misDatos = ref(null);
const horario = ref([]);
const comentarios = ref([]);
const avisos = ref([]);
const recursos = ref([]);
const nuevoComentario = ref('');
const errorDocumento = ref('');
const errorCarga = ref('');

function claseEstadoPago(estado) {
  if (estado === 'Al día') return 'bg-green-100 text-green-700';
  if (estado === 'Moroso') return 'bg-red-100 text-red-700';
  return 'bg-amber-100 text-amber-700';
}

function salir() {
  localStorage.removeItem('prevenseg_token');
  localStorage.removeItem('prevenseg_refresh');
  localStorage.removeItem('prevenseg_usuario');
  router.push('/login');
}

async function cargarTodo() {
  errorCarga.value = '';
  try {
    const { data } = await api.get('/portal/mis-datos');
    misDatos.value = data;
  } catch (e) {
    errorCarga.value = e.response?.data?.error || 'No se pudo cargar tu ficha. Contacta a la administración.';
    return;
  }
  try {
    const { data } = await api.get('/portal/mi-horario');
    horario.value = data;
  } catch (e) {
    console.error('No se pudo cargar el horario:', e.response?.data?.error);
  }
  try {
    const { data } = await api.get('/portal/comentarios');
    comentarios.value = data;
  } catch (e) {
    console.error('No se pudieron cargar los comentarios:', e.response?.data?.error);
  }
  try {
    const { data } = await api.get('/portal/avisos');
    avisos.value = data;
  } catch (e) {
    console.error('No se pudieron cargar los avisos:', e.response?.data?.error);
  }
  try {
    const { data } = await api.get('/portal/recursos');
    recursos.value = data;
  } catch (e) {
    console.error('No se pudieron cargar los documentos:', e.response?.data?.error);
  }
}

async function enviarComentario() {
  if (!nuevoComentario.value) return;
  await api.post('/portal/comentarios', { mensaje: nuevoComentario.value });
  nuevoComentario.value = '';
  const { data } = await api.get('/portal/comentarios');
  comentarios.value = data;
}

async function descargarRecurso(r) {
  const respuesta = await api.get(`/portal/recursos/${r.id}/descargar`, { responseType: 'blob' });
  const url = URL.createObjectURL(respuesta.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = r.nombre_original;
  a.click();
}

onMounted(cargarTodo);
</script>
