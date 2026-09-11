<template>
  <div class="p-8">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-3xl font-bold text-primary-700">Relatores</h1>
        <p class="text-sm text-gray-500">Docentes y asignaturas</p>
      </div>
      <button @click="nuevo" class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm">+ Nuevo relator</button>
    </div>

    <div class="bg-white rounded-xl shadow p-5 mb-6">
      <table class="w-full text-sm">
        <thead class="text-left text-gray-500">
          <tr><th class="py-1">Relator</th><th>RUT</th><th>Asignatura</th><th>Horas asignadas</th><th>Valor hora</th><th>Acciones</th></tr>
        </thead>
        <tbody>
          <tr v-for="r in relatores" :key="r.id" class="border-t" :class="form.id === r.id ? 'bg-primary-50' : ''">
            <td class="py-2">
              <div class="flex items-center gap-2">
                <AvatarBadge :nombre="r.nombre" size="sm" />
                {{ r.nombre }}
              </div>
            </td>
            <td>{{ r.rut }}</td>
            <td>{{ r.asignatura }}</td>
            <td>{{ r.total_horas }} hrs</td>
            <td>${{ Number(r.valor_hora).toLocaleString('es-CL') }}</td>
            <td class="space-x-2">
              <button @click="editar(r)" class="text-primary-600 hover:underline">Modificar</button>
              <button @click="asignarCurso(r)" class="text-accent hover:underline">Asignar</button>
              <button @click="abrirPagos(r)" class="text-green-700 hover:underline">Pagar</button>
              <button @click="eliminar(r)" class="text-red-600 hover:underline">Eliminar</button>
            </td>
          </tr>
          <tr v-if="!relatores.length"><td colspan="6" class="text-center text-gray-400 py-8">No hay relatores registrados</td></tr>
        </tbody>
      </table>

      <details v-if="relatorExpandido" class="mt-3" open>
        <summary class="text-sm text-gray-500 cursor-pointer" @click.prevent="relatorExpandido = null">
          Cursos asignados a {{ relatorExpandido.nombre }} ({{ relatorExpandido.relator_curso.length }})
        </summary>
        <ul class="mt-2 text-sm divide-y">
          <li v-for="rc in relatorExpandido.relator_curso" :key="rc.id" class="py-1 flex justify-between">
            <span>{{ rc.cursos ? rc.cursos.nombre_curso : '' }} - {{ rc.horas_asignadas }} hrs</span>
            <button @click="quitar(relatorExpandido, rc)" class="text-red-500 hover:underline text-xs">Quitar</button>
          </li>
        </ul>
      </details>
    </div>

    <div class="bg-white rounded-xl shadow p-5">
      <h2 class="font-semibold text-primary-700 mb-4">{{ form.id ? 'Modificar relator' : 'Nuevo / editar relator' }}</h2>
      <form @submit.prevent="guardar" class="grid grid-cols-3 gap-4">
        <div>
          <label class="text-xs text-gray-500">Nombre</label>
          <input v-model="form.nombre" required class="w-full border rounded-lg px-3 py-2" />
        </div>
        <div>
          <label class="text-xs text-gray-500">RUT</label>
          <input v-model="form.rut" @blur="validarRutForm" required class="w-full border rounded-lg px-3 py-2" />
          <p v-if="errorRut" class="text-red-600 text-xs mt-1">{{ errorRut }}</p>
        </div>
        <div>
          <label class="text-xs text-gray-500">Teléfono</label>
          <input v-model="form.telefono" class="w-full border rounded-lg px-3 py-2" />
        </div>
        <div>
          <label class="text-xs text-gray-500">Correo</label>
          <input v-model="form.correo" class="w-full border rounded-lg px-3 py-2" />
        </div>
        <div>
          <label class="text-xs text-gray-500">Asignatura que imparte</label>
          <input v-model="form.asignatura" class="w-full border rounded-lg px-3 py-2" />
        </div>
        <div>
          <label class="text-xs text-gray-500">Valor hora</label>
          <input v-model.number="form.valor_hora" type="number" class="w-full border rounded-lg px-3 py-2" />
        </div>

        <div class="col-span-3 flex gap-2 mt-1">
          <button type="submit" class="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-lg text-sm">Guardar</button>
          <button type="button" @click="asignarCurso(form)" :disabled="!form.id" class="border border-primary-500 text-primary-600 px-5 py-2 rounded-lg text-sm disabled:opacity-40">
            Asignar a curso
          </button>
          <button v-if="form.id" type="button" @click="nuevo" class="text-gray-500 text-sm px-3">Cancelar edición</button>
        </div>
      </form>
    </div>

    <div v-if="relatorAsignando" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <form @submit.prevent="confirmarAsignacion" class="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <h2 class="text-lg font-semibold text-primary-700 mb-4">Asignar {{ relatorAsignando.nombre }} a un curso</h2>
        <select v-model="asignacion.curso_id" required class="w-full border rounded-lg px-3 py-2 mb-3">
          <option disabled value="">Selecciona un curso</option>
          <option v-for="c in cursos" :key="c.id" :value="c.id">{{ c.nombre_curso }}</option>
        </select>
        <input v-model.number="asignacion.horas_asignadas" type="number" placeholder="Horas asignadas" required class="w-full border rounded-lg px-3 py-2 mb-3" />
        <div class="flex justify-end gap-2">
          <button type="button" @click="relatorAsignando = null" class="px-4 py-2 rounded-lg text-gray-600">Cancelar</button>
          <button type="submit" class="px-4 py-2 rounded-lg bg-primary-600 text-white">Asignar</button>
        </div>
      </form>
    </div>

    <!-- Modal Pagos al relator -->
    <div v-if="fichaPago" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-2xl shadow-xl">
        <h2 class="text-lg font-semibold text-primary-700 mb-4">Pagos a {{ fichaPago.relator.nombre }}</h2>

        <div class="grid grid-cols-3 gap-4 mb-5">
          <div class="bg-primary-50 rounded-lg p-3 text-center">
            <p class="text-xs text-gray-500">Total a pagar</p>
            <p class="font-semibold text-primary-700">${{ fichaPago.totalAPagar.toLocaleString('es-CL') }}</p>
          </div>
          <div class="bg-primary-50 rounded-lg p-3 text-center">
            <p class="text-xs text-gray-500">Pagado</p>
            <p class="font-semibold text-primary-700">${{ fichaPago.totalPagado.toLocaleString('es-CL') }}</p>
          </div>
          <div class="bg-primary-50 rounded-lg p-3 text-center">
            <p class="text-xs text-gray-500">Saldo pendiente</p>
            <p class="font-semibold" :class="fichaPago.saldoPendiente > 0 ? 'text-red-600' : 'text-accent'">
              ${{ fichaPago.saldoPendiente.toLocaleString('es-CL') }}
            </p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-6">
          <div>
            <h3 class="text-sm font-medium text-gray-600 mb-2">Historial</h3>
            <table class="w-full text-sm">
              <thead class="text-left text-gray-500"><tr><th class="py-1">Fecha</th><th>Curso</th><th>Monto</th></tr></thead>
              <tbody>
                <tr v-for="p in fichaPago.pagos" :key="p.id" class="border-t">
                  <td class="py-1">{{ new Date(p.created_at).toLocaleDateString('es-CL') }}</td>
                  <td>{{ p.cursos ? p.cursos.nombre_curso : '-' }}</td>
                  <td>${{ Number(p.monto).toLocaleString('es-CL') }}</td>
                </tr>
                <tr v-if="!fichaPago.pagos.length"><td colspan="3" class="text-center text-gray-400 py-3">Sin pagos registrados</td></tr>
              </tbody>
            </table>
          </div>

          <form @submit.prevent="registrarPagoRelator">
            <h3 class="text-sm font-medium text-gray-600 mb-2">Registrar pago</h3>
            <select v-model="pagoRelator.curso_id" class="w-full border rounded-lg px-3 py-2 mb-2">
              <option :value="null">Curso (opcional)</option>
              <option v-for="rc in fichaPago.relator.relator_curso" :key="rc.cursos.id" :value="rc.cursos.id">{{ rc.cursos.nombre_curso }}</option>
            </select>
            <input v-model.number="pagoRelator.monto" type="number" placeholder="Monto" required class="w-full border rounded-lg px-3 py-2 mb-2" />
            <input v-model="pagoRelator.medio_pago" placeholder="Medio de pago (ej: Transferencia)" class="w-full border rounded-lg px-3 py-2 mb-2" />
            <input v-model="pagoRelator.observacion" placeholder="Observación (opcional)" class="w-full border rounded-lg px-3 py-2 mb-3" />
            <button type="submit" class="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg text-sm">Registrar pago</button>
          </form>
        </div>

        <div class="flex justify-end mt-5">
          <button @click="fichaPago = null" class="px-4 py-2 rounded-lg text-gray-600">Cerrar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../lib/api.js';
import { validarRut, formatearRut } from '../lib/rut.js';
import AvatarBadge from '../components/AvatarBadge.vue';

const relatores = ref([]);
const cursos = ref([]);
const form = ref({});
const errorRut = ref('');
const relatorAsignando = ref(null);
const asignacion = ref({});
const relatorExpandido = ref(null);
const fichaPago = ref(null);
const pagoRelator = ref({});

function validarRutForm() {
  if (!form.value.rut) return;
  if (!validarRut(form.value.rut)) {
    errorRut.value = 'El RUT ingresado no es válido (revisa el dígito verificador)';
  } else {
    errorRut.value = '';
    form.value.rut = formatearRut(form.value.rut);
  }
}

async function cargar() {
  const [r, c] = await Promise.all([api.get('/relatores'), api.get('/cursos')]);
  relatores.value = r.data;
  cursos.value = c.data;
}

function nuevo() {
  form.value = {};
  errorRut.value = '';
  relatorExpandido.value = null;
}

function editar(r) {
  form.value = { ...r, relator_curso: undefined };
  errorRut.value = '';
  relatorExpandido.value = r;
}

async function guardar() {
  validarRutForm();
  if (errorRut.value) return;
  if (form.value.id) {
    await api.put(`/relatores/${form.value.id}`, form.value);
  } else {
    await api.post('/relatores', form.value);
  }
  nuevo();
  cargar();
}

async function eliminar(r) {
  if (!confirm(`¿Eliminar a ${r.nombre}?`)) return;
  await api.delete(`/relatores/${r.id}`);
  cargar();
}

function asignarCurso(r) {
  relatorAsignando.value = r;
  asignacion.value = {};
}

async function confirmarAsignacion() {
  await api.post(`/relatores/${relatorAsignando.value.id}/asignar`, asignacion.value);
  relatorAsignando.value = null;
  cargar();
}

async function quitar(r, rc) {
  if (!confirm('¿Quitar esta asignación?')) return;
  await api.delete(`/relatores/${r.id}/asignar/${rc.cursos ? rc.cursos.id : ''}`);
  cargar();
}

async function abrirPagos(r) {
  const { data } = await api.get(`/pagos-relatores/relator/${r.id}`);
  fichaPago.value = data;
  pagoRelator.value = { relator_id: r.id, curso_id: null };
}

async function registrarPagoRelator() {
  await api.post('/pagos-relatores', pagoRelator.value);
  await abrirPagos({ id: pagoRelator.value.relator_id });
}

onMounted(cargar);
</script>
