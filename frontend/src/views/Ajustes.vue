<template>
  <div class="p-8">
    <h1 class="text-3xl font-bold text-primary-700 mb-1">Ajustes</h1>
    <p class="text-gray-500 mb-6">Configuración del sistema</p>

    <div class="flex gap-2 mb-6">
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

    <div v-if="tab === 'Usuarios'" class="bg-white rounded-xl shadow p-5 mb-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="font-semibold text-primary-700">Usuarios del sistema</h2>
        <button @click="mostrarNuevoUsuario = true" class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm">+ Nuevo usuario</button>
      </div>
      <table class="w-full text-sm">
        <thead class="text-left text-gray-500">
          <tr><th class="py-1">Nombre</th><th>Correo</th><th>Rol</th></tr>
        </thead>
        <tbody>
          <tr v-for="u in usuariosStaff" :key="u.id" class="border-t">
            <td class="py-2">
              <div class="flex items-center gap-2">
                <AvatarBadge :nombre="u.nombre || u.email" size="sm" />
                {{ u.nombre || '-' }}
              </div>
            </td>
            <td class="py-2 text-gray-500">{{ u.email }}</td>
            <td class="py-2">
              <div class="flex items-center gap-2 flex-wrap">
                <select v-model="u.rol" class="border rounded-lg px-2 py-1 text-sm">
                  <option value="administrador">Administrador</option>
                  <option value="ventas">Ventas</option>
                  <option value="finanzas">Finanzas</option>
                  <option value="alumno">Alumno</option>
                </select>
                <button @click="actualizarRol(u)" class="text-primary-600 text-sm hover:underline">Guardar</button>
                <button @click="abrirCambioPassword(u)" class="text-amber-600 text-sm hover:underline">Cambiar contraseña</button>
                <button @click="eliminarUsuario(u)" class="text-red-600 text-sm hover:underline">Eliminar</button>
                <span v-if="guardadoUsuarioId === u.id" class="text-accent text-xs">Guardado ✓</span>
              </div>
            </td>
          </tr>
          <tr v-if="!usuariosStaff.length"><td colspan="3" class="text-center text-gray-400 py-4">Sin usuarios</td></tr>
        </tbody>
      </table>
    </div>

    <div v-if="tab === 'Usuarios'" class="bg-white rounded-xl shadow p-5">
      <div class="flex justify-between items-center mb-1">
        <h2 class="font-semibold text-primary-700">Cuentas del Portal del Alumno</h2>
        <button
          v-if="alumnosSeleccionados.length"
          @click="eliminarAlumnosSeleccionados"
          class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
        >
          Eliminar {{ alumnosSeleccionados.length }} seleccionado{{ alumnosSeleccionados.length === 1 ? '' : 's' }}
        </button>
      </div>
      <p class="text-sm text-gray-500 mb-4">Útil para quitar el acceso a todos los alumnos de un curso ya terminado, de una sola vez.</p>
      <table class="w-full text-sm">
        <thead class="text-left text-gray-500">
          <tr>
            <th class="py-1 w-8"><input type="checkbox" @change="marcarTodosAlumnos($event.target.checked)" /></th>
            <th>Nombre</th><th>Correo</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in usuariosAlumnos" :key="u.id" class="border-t">
            <td class="py-2"><input type="checkbox" v-model="alumnosSeleccionados" :value="u.id" /></td>
            <td class="py-2">
              <div class="flex items-center gap-2">
                <AvatarBadge :nombre="u.nombre || u.email" size="sm" />
                {{ u.nombre || '-' }}
              </div>
            </td>
            <td class="py-2 text-gray-500 flex items-center justify-between gap-2">
              {{ u.email }}
              <button @click="eliminarUsuario(u)" class="text-red-600 text-sm hover:underline">Eliminar</button>
            </td>
          </tr>
          <tr v-if="!usuariosAlumnos.length"><td colspan="3" class="text-center text-gray-400 py-4">Sin cuentas de alumnos activas</td></tr>
        </tbody>
      </table>

      <div v-if="mostrarNuevoUsuario" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <form @submit.prevent="crearUsuario" class="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
          <h3 class="font-semibold text-primary-700 mb-4">Nuevo usuario</h3>
          <input v-model="nuevoUsuario.nombre" placeholder="Nombre completo" required class="w-full border rounded-lg px-3 py-2 mb-3" />
          <input v-model="nuevoUsuario.email" type="email" placeholder="Correo" required class="w-full border rounded-lg px-3 py-2 mb-3" />
          <input v-model="nuevoUsuario.password" type="password" placeholder="Contraseña temporal" required class="w-full border rounded-lg px-3 py-2 mb-3" />
          <select v-model="nuevoUsuario.rol" class="w-full border rounded-lg px-3 py-2 mb-4">
            <option value="ventas">Ventas</option>
            <option value="finanzas">Finanzas</option>
            <option value="administrador">Administrador</option>
          </select>
          <p v-if="errorUsuario" class="text-red-600 text-xs mb-3">{{ errorUsuario }}</p>
          <div class="flex justify-end gap-2">
            <button type="button" @click="mostrarNuevoUsuario = false" class="px-4 py-2 rounded-lg text-gray-600">Cancelar</button>
            <button type="submit" class="px-4 py-2 rounded-lg bg-primary-600 text-white">Crear</button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="usuarioPassword" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <form @submit.prevent="guardarPassword" class="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
        <h3 class="font-semibold text-primary-700 mb-4">Cambiar contraseña de {{ usuarioPassword.nombre || usuarioPassword.email }}</h3>
        <input v-model="nuevaPassword" type="text" minlength="6" required placeholder="Nueva contraseña (mín. 6 caracteres)" class="w-full border rounded-lg px-3 py-2 mb-4" />
        <div class="flex justify-end gap-2">
          <button type="button" @click="usuarioPassword = null" class="px-4 py-2 rounded-lg text-gray-600">Cancelar</button>
          <button type="submit" class="px-4 py-2 rounded-lg bg-primary-600 text-white">Guardar</button>
        </div>
      </form>
    </div>

    <div v-if="tab === 'Textos predeterminados'" class="bg-white rounded-xl shadow p-5">
      <h2 class="font-semibold text-primary-700 mb-1">Texto del comprobante de pago</h2>
      <p class="text-sm text-gray-500 mb-3">Este texto aparece al final de cada comprobante de pago impreso.</p>
      <textarea v-model="textoComprobante" rows="4" class="w-full border rounded-lg px-3 py-2 mb-3"></textarea>
      <button @click="guardarTexto" class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm">Guardar texto</button>
      <p v-if="guardadoTexto" class="text-accent text-sm mt-2">Guardado.</p>
    </div>

    <div v-if="tab === 'APIs'" class="bg-white rounded-xl shadow p-5 space-y-6">
      <div>
        <h2 class="font-semibold text-primary-700 mb-1">Correo (SMTP)</h2>
        <p class="text-sm text-gray-500 mb-3">Con Gmail: activa verificación en 2 pasos y genera una contraseña de aplicación en myaccount.google.com/apppasswords</p>
        <div class="grid grid-cols-2 gap-3">
          <input v-model="config.smtp_host" placeholder="Servidor (ej: smtp.gmail.com)" class="border rounded-lg px-3 py-2" />
          <input v-model="config.smtp_port" placeholder="Puerto (ej: 587)" class="border rounded-lg px-3 py-2" />
          <input v-model="config.smtp_user" placeholder="Correo remitente" class="border rounded-lg px-3 py-2" />
          <input v-model="config.smtp_pass" type="password" placeholder="Contraseña de aplicación" class="border rounded-lg px-3 py-2" />
          <input v-model="config.smtp_from" placeholder="Nombre a mostrar" class="border rounded-lg px-3 py-2 col-span-2" />
        </div>
        <button @click="guardarConfigApis" class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm mt-3">Guardar</button>
        <p v-if="guardadoConfig" class="text-accent text-sm mt-2">Guardado.</p>
      </div>

      <div class="border-t pt-5">
        <h2 class="font-semibold text-primary-700 mb-1">WhatsApp</h2>
        <p class="text-sm text-gray-500">La vinculación se hace por código QR desde el módulo de Notificaciones, no requiere credenciales aquí.</p>
        <router-link to="/notificaciones" class="text-sm text-primary-600 hover:underline">Ir a Notificaciones</router-link>
      </div>
    </div>

    <div v-if="tab === 'Respaldo'" class="bg-white rounded-xl shadow p-5">
      <h2 class="font-semibold text-primary-700 mb-3">Respaldo de información</h2>
      <div class="flex flex-wrap gap-3">
        <button @click="descargar('/ajustes/respaldo/archivos')" class="border border-primary-500 text-primary-600 px-4 py-2 rounded-lg text-sm">Exportar archivos (plantillas)</button>
        <button @click="descargar('/ajustes/respaldo/base-datos')" class="border border-primary-500 text-primary-600 px-4 py-2 rounded-lg text-sm">Exportar base de datos</button>
        <button @click="ejecutarBackupCompleto" class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm">Ejecutar backup completo</button>
      </div>
      <p class="text-xs text-gray-400 mt-3">El respaldo de base de datos descarga un archivo .json con toda la información de alumnos, cursos, pagos, relatores y horarios.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import api from '../lib/api.js';
import AvatarBadge from '../components/AvatarBadge.vue';

const tabs = ['Usuarios', 'Textos predeterminados', 'APIs', 'Respaldo'];
const tab = ref('Usuarios');

const usuarios = ref([]);
const usuariosStaff = computed(() => usuarios.value.filter((u) => u.rol !== 'alumno'));
const usuariosAlumnos = computed(() => usuarios.value.filter((u) => u.rol === 'alumno'));
const alumnosSeleccionados = ref([]);

function marcarTodosAlumnos(checked) {
  alumnosSeleccionados.value = checked ? usuariosAlumnos.value.map((u) => u.id) : [];
}
const mostrarNuevoUsuario = ref(false);
const nuevoUsuario = ref({ rol: 'ventas' });
const errorUsuario = ref('');
const guardadoUsuarioId = ref(null);
const usuarioPassword = ref(null);
const nuevaPassword = ref('');

function abrirCambioPassword(u) {
  usuarioPassword.value = u;
  nuevaPassword.value = '';
}

async function guardarPassword() {
  try {
    await api.put(`/ajustes/usuarios/${usuarioPassword.value.id}/password`, { password: nuevaPassword.value });
    alert('Contraseña actualizada correctamente.');
    usuarioPassword.value = null;
  } catch (e) {
    alert(e.response?.data?.error || 'No se pudo cambiar la contraseña.');
  }
}

const textoComprobante = ref('');
const guardadoTexto = ref(false);

const config = ref({});
const guardadoConfig = ref(false);

async function cargarUsuarios() {
  const { data } = await api.get('/ajustes/usuarios');
  usuarios.value = data;
}

async function crearUsuario() {
  errorUsuario.value = '';
  try {
    await api.post('/ajustes/usuarios', nuevoUsuario.value);
    mostrarNuevoUsuario.value = false;
    nuevoUsuario.value = { rol: 'ventas' };
    cargarUsuarios();
  } catch (e) {
    errorUsuario.value = e.response?.data?.error || 'No se pudo crear el usuario';
  }
}

async function actualizarRol(u) {
  await api.put(`/ajustes/usuarios/${u.id}`, { rol: u.rol, nombre: u.nombre });
  guardadoUsuarioId.value = u.id;
  setTimeout(() => (guardadoUsuarioId.value = null), 2000);
}

async function eliminarUsuario(u) {
  if (!confirm(`¿Eliminar la cuenta de ${u.nombre || u.email}? Esta acción no se puede deshacer.`)) return;
  try {
    await api.delete(`/ajustes/usuarios/${u.id}`);
    cargarUsuarios();
  } catch (e) {
    alert(e.response?.data?.error || 'No se pudo eliminar la cuenta.');
  }
}

async function eliminarAlumnosSeleccionados() {
  if (!confirm(`¿Eliminar el acceso de ${alumnosSeleccionados.value.length} alumno(s)? Esta acción no se puede deshacer.`)) return;
  try {
    await api.post('/ajustes/usuarios/eliminar-varios', { ids: alumnosSeleccionados.value });
    alumnosSeleccionados.value = [];
    cargarUsuarios();
  } catch (e) {
    alert(e.response?.data?.error || 'No se pudieron eliminar las cuentas.');
  }
}

async function cargarTexto() {
  const { data } = await api.get('/ajustes/textos/texto_comprobante_pago');
  textoComprobante.value = data.valor;
}

async function guardarTexto() {
  await api.put('/ajustes/textos/texto_comprobante_pago', { valor: textoComprobante.value });
  guardadoTexto.value = true;
  setTimeout(() => (guardadoTexto.value = false), 2000);
}

async function cargarConfigApis() {
  const { data } = await api.get('/ajustes/config-apis');
  config.value = data;
}

async function guardarConfigApis() {
  await api.put('/ajustes/config-apis', config.value);
  guardadoConfig.value = true;
  setTimeout(() => (guardadoConfig.value = false), 2000);
}

async function descargar(ruta) {
  const respuesta = await api.get(ruta, { responseType: 'blob' });
  const nombre = respuesta.headers['content-disposition']?.match(/filename="(.+)"/)?.[1] || 'respaldo';
  const url = URL.createObjectURL(respuesta.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
}

async function ejecutarBackupCompleto() {
  await descargar('/ajustes/respaldo/base-datos');
  await descargar('/ajustes/respaldo/archivos');
}

watch(tab, (t) => {
  if (t === 'Usuarios' && !usuarios.value.length) cargarUsuarios();
  if (t === 'Textos predeterminados' && !textoComprobante.value) cargarTexto();
  if (t === 'APIs' && !Object.keys(config.value).length) cargarConfigApis();
});

onMounted(cargarUsuarios);
</script>
