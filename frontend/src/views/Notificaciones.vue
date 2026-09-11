<template>
  <div class="p-8">
    <h1 class="text-3xl font-bold text-primary-700">Notificaciones</h1>
    <p class="text-sm text-gray-500 mb-6">Envío masivo a alumnos y relatores</p>

    <div class="bg-white rounded-xl shadow p-5 mb-6">
      <label class="text-sm text-gray-500">Curso</label>
      <select v-model="cursoId" @change="cargarAlumnos" class="block w-full max-w-sm border rounded-lg px-3 py-2 mt-1">
        <option disabled value="">Selecciona un curso</option>
        <option v-for="c in cursos" :key="c.id" :value="c.id">{{ c.tipo_curso }} - {{ c.nombre_curso }}</option>
      </select>
    </div>

    <div v-if="alumnos.length" class="bg-white rounded-xl shadow p-5 mb-6">
      <div class="flex justify-between items-center mb-3">
        <h2 class="font-semibold text-primary-700">Destinatarios ({{ alumnos.length }} alumnos)</h2>
        <label class="text-sm text-gray-500 flex items-center gap-2">
          <input type="checkbox" @change="marcarTodos($event.target.checked)" /> Seleccionar todos
        </label>
      </div>
      <table class="w-full text-sm">
        <thead class="text-left text-gray-500">
          <tr><th class="py-1 w-8"></th><th>Alumno</th><th>Correo</th><th>Teléfono</th></tr>
        </thead>
        <tbody>
          <tr v-for="a in alumnos" :key="a.id" class="border-t">
            <td class="py-2"><input type="checkbox" v-model="seleccionados" :value="a.id" /></td>
            <td class="py-2">
              <div class="flex items-center gap-2">
                <AvatarBadge :nombre="a.nombres + ' ' + a.apellido_paterno" size="sm" />
                {{ a.nombres }} {{ a.apellido_paterno }}
              </div>
            </td>
            <td class="py-2 text-gray-500">{{ a.correo || '-' }}</td>
            <td class="py-2 text-gray-500">{{ a.telefono || '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="alumnos.length" class="bg-white rounded-xl shadow p-5">
      <h2 class="font-semibold text-primary-700 mb-3">Mensaje</h2>
      <input v-if="medio === 'correo'" v-model="asunto" placeholder="Asunto del correo" class="w-full border rounded-lg px-3 py-2 mb-3" />
      <textarea v-model="mensaje" rows="4" placeholder="Escribe el mensaje a enviar..." class="w-full border rounded-lg px-3 py-2 mb-4"></textarea>

      <div class="flex gap-2 mb-4">
        <button
          @click="medio = 'correo'"
          class="px-4 py-2 rounded-lg text-sm border"
          :class="medio === 'correo' ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 text-gray-600'"
        >
          Correo electrónico
        </button>
        <button
          @click="seleccionarWhatsapp"
          class="px-4 py-2 rounded-lg text-sm border"
          :class="medio === 'whatsapp' ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 text-gray-600'"
        >
          WhatsApp
        </button>
      </div>

      <div v-if="medio === 'whatsapp' && estadoWhatsapp === 'error'" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-center">
        <p class="text-sm text-red-700 mb-1">No se pudo conectar con WhatsApp.</p>
        <p class="text-xs text-gray-500 mb-3">{{ errorWhatsapp }}</p>
        <button @click="reintentarWhatsapp" :disabled="reintentando" class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50">
          {{ reintentando ? 'Reiniciando...' : 'Reintentar (borra la sesión y pide QR nuevo)' }}
        </button>
      </div>
      <div v-else-if="medio === 'whatsapp' && estadoWhatsapp !== 'conectado'" class="bg-primary-50 rounded-lg p-4 mb-4 text-center">
        <p v-if="estadoWhatsapp === 'esperando_qr' && qr" class="text-sm text-gray-600 mb-2">
          Escanea este código con WhatsApp (Ajustes → Dispositivos vinculados) desde el celular de la empresa:
        </p>
        <img v-if="qr" :src="qr" class="mx-auto w-40 h-40" />
        <p v-else class="text-sm text-gray-500">Conectando con WhatsApp...</p>
      </div>
      <p v-if="medio === 'whatsapp' && estadoWhatsapp === 'conectado'" class="text-sm text-accent mb-4">WhatsApp vinculado y listo para enviar.</p>

      <button
        @click="enviar"
        :disabled="!seleccionados.length || !mensaje || enviando || (medio === 'whatsapp' && estadoWhatsapp !== 'conectado')"
        class="bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white px-5 py-2.5 rounded-lg text-sm"
      >
        {{ enviando ? 'Enviando...' : `Enviar a ${seleccionados.length} seleccionado${seleccionados.length === 1 ? '' : 's'}` }}
      </button>

      <div v-if="resultados.length" class="mt-4 text-sm space-y-1">
        <p v-for="r in resultados" :key="r.alumno" :class="r.ok ? 'text-accent' : 'text-red-600'">
          {{ r.ok ? 'OK' : 'Error' }} - {{ r.alumno }} <span v-if="!r.ok" class="text-gray-400">- {{ r.error }}</span>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../lib/api.js';
import AvatarBadge from '../components/AvatarBadge.vue';

const cursos = ref([]);
const alumnos = ref([]);
const cursoId = ref('');
const seleccionados = ref([]);
const mensaje = ref('');
const asunto = ref('');
const medio = ref('correo');
const enviando = ref(false);
const resultados = ref([]);
const estadoWhatsapp = ref('desconectado');
const qr = ref(null);
const errorWhatsapp = ref('');
const reintentando = ref(false);
let intervaloQr = null;

async function cargarAlumnos() {
  const { data } = await api.get('/cursos/' + cursoId.value);
  alumnos.value = data.alumnos || [];
  seleccionados.value = [];
  resultados.value = [];
}

function marcarTodos(checked) {
  seleccionados.value = checked ? alumnos.value.map((a) => a.id) : [];
}

async function seleccionarWhatsapp() {
  medio.value = 'whatsapp';
  await consultarEstadoWhatsapp();
  if (!intervaloQr) {
    intervaloQr = setInterval(consultarEstadoWhatsapp, 4000);
  }
}

async function consultarEstadoWhatsapp() {
  const { data } = await api.get('/notificaciones/whatsapp/estado');
  estadoWhatsapp.value = data.estado;
  errorWhatsapp.value = data.error || '';
  // Si hay error, dejamos de consultar solo: hay que presionar "Reintentar" a propósito
  if (data.estado === 'error' && intervaloQr) {
    clearInterval(intervaloQr);
    intervaloQr = null;
  }
  qr.value = data.qr;
  if (data.estado === 'conectado' && intervaloQr) {
    clearInterval(intervaloQr);
    intervaloQr = null;
  }
}

async function reintentarWhatsapp() {
  reintentando.value = true;
  try {
    const { data } = await api.post('/notificaciones/whatsapp/reiniciar');
    estadoWhatsapp.value = data.estado;
    qr.value = data.qr;
    errorWhatsapp.value = '';
    if (!intervaloQr) intervaloQr = setInterval(consultarEstadoWhatsapp, 4000);
  } finally {
    reintentando.value = false;
  }
}

async function enviar() {
  enviando.value = true;
  resultados.value = [];
  try {
    const { data } = await api.post('/notificaciones/enviar', {
      medio: medio.value,
      alumno_ids: seleccionados.value,
      mensaje: mensaje.value,
      asunto: asunto.value
    });
    resultados.value = data.resultados;
  } finally {
    enviando.value = false;
  }
}

onMounted(async () => {
  const { data } = await api.get('/cursos');
  cursos.value = data;
});
</script>
