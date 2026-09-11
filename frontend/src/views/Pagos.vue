<template>
  <div class="p-8">
    <h1 class="text-3xl font-bold text-primary-700">Pagos</h1>
    <p class="text-sm text-gray-500 mb-6">Registro de pagos y comprobantes</p>

    <div class="flex gap-2 mb-4">
      <button
        @click="cambiarModo('alumno')"
        class="px-4 py-2 rounded-lg text-sm border"
        :class="modoBusqueda === 'alumno' ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 text-gray-600'"
      >
        Buscar alumno
      </button>
      <button
        @click="cambiarModo('curso')"
        class="px-4 py-2 rounded-lg text-sm border"
        :class="modoBusqueda === 'curso' ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 text-gray-600'"
      >
        Buscar por curso
      </button>
    </div>

    <!-- Buscar por alumno -->
    <div v-if="modoBusqueda === 'alumno'" class="bg-white rounded-xl shadow p-5 mb-6">
      <label class="text-sm text-gray-500">Buscar alumno por nombre o RUT</label>
      <div class="flex gap-2 mt-1">
        <input v-model="buscar" @keyup.enter="buscarAlumnos" placeholder="Ej: Juan Pérez / 12.345.678-9" class="flex-1 border rounded-lg px-3 py-2" />
        <button @click="buscarAlumnos" class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm">Buscar</button>
      </div>

      <ul v-if="resultados.length" class="mt-3 divide-y">
        <li v-for="al in resultados" :key="al.id" @click="seleccionar(al)" class="py-2 cursor-pointer hover:text-primary-600 flex items-center gap-3">
          <AvatarBadge :nombre="al.nombres + ' ' + al.apellido_paterno" size="sm" />
          {{ al.nombres }} {{ al.apellido_paterno }} — {{ al.rut }} <span class="text-gray-400 text-sm">({{ al.cursos?.nombre_curso || 'sin curso' }})</span>
        </li>
      </ul>
    </div>

    <!-- Buscar por curso: listado completo con estado de pago -->
    <div v-if="modoBusqueda === 'curso'" class="bg-white rounded-xl shadow p-5 mb-6">
      <label class="text-sm text-gray-500">Curso</label>
      <select v-model="cursoListado" @change="cargarListadoCurso" class="block w-full max-w-sm border rounded-lg px-3 py-2 mt-1 mb-4">
        <option disabled value="">Selecciona un curso</option>
        <option v-for="c in cursos" :key="c.id" :value="c.id">{{ c.nombre_curso }}</option>
      </select>

      <table v-if="listadoCurso.length" class="w-full text-sm">
        <thead class="text-left text-gray-500">
          <tr><th class="py-1">Alumno</th><th>RUT</th><th>Valor curso</th><th>Pagado</th><th>Saldo</th><th>Estado</th></tr>
        </thead>
        <tbody>
          <tr v-for="a in listadoCurso" :key="a.id" @click="seleccionarDesdeListado(a)" class="border-t cursor-pointer hover:bg-gray-50">
            <td class="py-2 flex items-center gap-2">
              <AvatarBadge :nombre="a.nombres + ' ' + a.apellido_paterno" size="sm" />
              {{ a.nombres }} {{ a.apellido_paterno }}
            </td>
            <td>{{ a.rut }}</td>
            <td>${{ a.valorCurso.toLocaleString('es-CL') }}</td>
            <td>${{ a.pagado.toLocaleString('es-CL') }}</td>
            <td>${{ a.saldo.toLocaleString('es-CL') }}</td>
            <td><span class="px-2 py-0.5 rounded-full text-xs" :class="claseBadgeEstado(a.estadoFinanciero)">{{ a.estadoFinanciero }}</span></td>
          </tr>
        </tbody>
      </table>
      <p v-else-if="cursoListado" class="text-center text-gray-400 py-6">Este curso no tiene alumnos inscritos</p>
    </div>

    <!-- Datos del alumno + curso + historial -->
    <div v-if="detalle" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 bg-white rounded-xl shadow p-5">
        <h2 class="font-semibold text-primary-700 mb-1 flex items-center gap-2">
          <AvatarBadge :nombre="detalle.alumno.nombres + ' ' + detalle.alumno.apellido_paterno" size="sm" />
          {{ detalle.alumno.nombres }} {{ detalle.alumno.apellido_paterno }}
        </h2>
        <p class="text-sm text-gray-500 mb-4">
          RUT: {{ detalle.alumno.rut }} · Curso: {{ detalle.alumno.cursos?.nombre_curso || '—' }}
          <span v-if="detalle.pagos.length"> · Última cuota pagada: {{ formatearFecha(detalle.pagos[0].created_at.slice(0,10)) }}</span>
        </p>

        <div class="grid grid-cols-3 gap-4 mb-6">
          <div class="bg-primary-50 rounded-lg p-3 text-center">
            <p class="text-xs text-gray-500">Valor curso</p>
            <p class="font-semibold text-primary-700">${{ detalle.valorCurso.toLocaleString('es-CL') }}</p>
          </div>
          <div class="bg-primary-50 rounded-lg p-3 text-center">
            <p class="text-xs text-gray-500">Pagado</p>
            <p class="font-semibold text-primary-700">${{ detalle.totalPagado.toLocaleString('es-CL') }}</p>
          </div>
          <div class="bg-primary-50 rounded-lg p-3 text-center">
            <p class="text-xs text-gray-500">Saldo pendiente</p>
            <p class="font-semibold" :class="detalle.saldoPendiente > 0 ? 'text-primary-600' : 'text-accent'">
              ${{ detalle.saldoPendiente.toLocaleString('es-CL') }}
            </p>
          </div>
        </div>

        <h3 class="text-sm font-medium text-gray-600 mb-2">Historial de pagos</h3>
        <table class="w-full text-sm">
          <thead class="text-left text-gray-500">
            <tr><th class="py-1">Fecha</th><th>Monto</th><th>Medio</th><th>Estado</th><th></th></tr>
          </thead>
          <tbody>
            <tr v-for="p in detalle.pagos" :key="p.id" class="border-t" :class="p.anulado && 'opacity-50 line-through'">
              <td class="py-1">{{ new Date(p.created_at).toLocaleDateString('es-CL') }}</td>
              <td>${{ Number(p.monto).toLocaleString('es-CL') }}</td>
              <td>{{ p.medio_pago }}</td>
              <td><span class="px-2 py-0.5 rounded-full text-xs" :class="claseBadgeEstado(p.anulado ? 'Anulado' : 'Vigente')">{{ p.anulado ? 'Anulado' : 'Vigente' }}</span></td>
              <td class="space-x-2">
                <button @click="imprimir(p)" class="text-primary-600 hover:underline">Imprimir</button>
                <button v-if="!p.anulado && esAdmin" @click="anular(p)" class="text-red-600 hover:underline">Anular</button>
              </td>
            </tr>
            <tr v-if="!detalle.pagos.length"><td colspan="5" class="text-center text-gray-400 py-4">Sin pagos registrados</td></tr>
          </tbody>
        </table>
      </div>

      <!-- Formulario nuevo pago -->
      <form @submit.prevent="registrarPago" class="bg-white rounded-xl shadow p-5 h-fit">
        <h3 class="font-semibold text-primary-700 mb-3">Registrar pago / abono</h3>

        <label class="text-xs text-gray-500">Monto a pagar</label>
        <input v-model.number="form.monto" type="number" required class="w-full border rounded-lg px-3 py-2 mb-3" />

        <label class="text-xs text-gray-500">Medio de pago</label>
        <select v-model="form.medio_pago" required class="w-full border rounded-lg px-3 py-2 mb-3">
          <option disabled value="">Selecciona</option>
          <option>Efectivo</option>
          <option>Débito</option>
          <option>Crédito</option>
          <option>Transferencia</option>
        </select>

        <div v-if="form.medio_pago === 'Débito' || form.medio_pago === 'Crédito'">
          <label class="text-xs text-gray-500">N° de operación</label>
          <input v-model="form.numero_operacion" class="w-full border rounded-lg px-3 py-2 mb-3" />
        </div>

        <div v-if="form.medio_pago === 'Transferencia'">
          <label class="text-xs text-gray-500">Nombre de quien transfiere</label>
          <input v-model="form.transferencia_nombre" class="w-full border rounded-lg px-3 py-2 mb-3" />
          <label class="text-xs text-gray-500">Banco</label>
          <input v-model="form.transferencia_banco" class="w-full border rounded-lg px-3 py-2 mb-3" />
        </div>

        <label class="text-xs text-gray-500">N° boleta SII (opcional)</label>
        <input v-model="form.boleta_sii" class="w-full border rounded-lg px-3 py-2 mb-3" />

        <a
          href="https://zeusr.sii.cl/AUT2000/InicioAutenticacion/IngresoRutClave.html?https://misiir.sii.cl/cgi_misii/siihome.cgi"
          target="_blank"
          class="block text-center bg-white border-2 border-primary-500 text-primary-600 font-medium py-2.5 rounded-lg mb-4 hover:bg-primary-50"
        >
          Generar boleta en el portal del SII
        </a>

        <button type="submit" class="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg text-sm">
          Registrar pago
        </button>
      </form>
    </div>

    <!-- Comprobante para imprimir -->
    <div v-if="comprobante" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 overflow-y-auto py-8">
      <div class="bg-white rounded-xl p-8 w-full max-w-xl shadow-xl flex flex-col relative overflow-hidden print:flex print:flex-col" id="comprobante-imprimible">
        <div class="absolute top-0 left-0 w-16 h-16 bg-slate-800" style="clip-path: polygon(0 0, 100% 0, 0 100%)"></div>
        <div class="absolute bottom-0 right-0 w-16 h-16 bg-primary-600" style="clip-path: polygon(100% 100%, 0 100%, 100% 0)"></div>

        <div class="flex justify-between items-start relative z-10">
          <div>
            <img src="../assets/logo.png" alt="Prevenseg" class="h-14" />
            <p class="text-[10px] tracking-widest text-gray-400 mt-1 ml-1">FORMACIÓN PARA UN TRABAJO MÁS SEGURO</p>
          </div>
          <div class="border-2 border-primary-600 rounded-lg px-4 py-1.5 text-center">
            <p class="text-xl font-extrabold text-primary-600 leading-none">N° {{ String(detalle.alumno.correlativo || detalle.alumno.id).padStart(4, '0') }}</p>
            <p class="text-[10px] font-medium text-gray-500 tracking-wide">COMPROBANTE</p>
          </div>
        </div>

        <div class="flex items-center gap-3 my-5">
          <div class="h-px bg-gray-300 flex-1"></div>
          <h2 class="text-lg font-bold text-slate-800 whitespace-nowrap">COMPROBANTE <span class="text-primary-600">DE PAGO</span></h2>
          <div class="h-px bg-gray-300 flex-1"></div>
        </div>

        <div class="rounded-lg overflow-hidden border mb-4">
          <div class="bg-primary-600 text-white text-sm font-semibold px-4 py-2 flex items-center gap-2">
            <span v-html="ICONOS.persona" class="w-4 h-4"></span> DATOS DEL ALUMNO
          </div>
          <div class="divide-y text-sm">
            <div class="flex items-center gap-3 px-4 py-2"><span v-html="ICONOS.persona" class="w-4 h-4 text-gray-400"></span><b class="w-36">Alumno:</b> {{ detalle.alumno.nombres }} {{ detalle.alumno.apellido_paterno }}</div>
            <div class="flex items-center gap-3 px-4 py-2"><span v-html="ICONOS.idCard" class="w-4 h-4 text-gray-400"></span><b class="w-36">RUT:</b> {{ detalle.alumno.rut }}</div>
            <div class="flex items-center gap-3 px-4 py-2"><span v-html="ICONOS.gorro" class="w-4 h-4 text-gray-400"></span><b class="w-36">Curso:</b> {{ detalle.alumno.cursos?.nombre_curso }}</div>
          </div>
        </div>

        <div class="rounded-lg overflow-hidden border mb-4">
          <div class="bg-slate-800 text-white text-sm font-semibold px-4 py-2 flex items-center gap-2">
            <span v-html="ICONOS.tarjeta" class="w-4 h-4"></span> DETALLE DEL PAGO
          </div>
          <div class="divide-y text-sm">
            <div class="flex items-center gap-3 px-4 py-2"><span v-html="ICONOS.moneda" class="w-4 h-4 text-gray-400"></span><b class="w-36">Valor del curso:</b> ${{ detalle.valorCurso.toLocaleString('es-CL') }}</div>
            <div class="flex items-center gap-3 px-4 py-2"><span v-html="ICONOS.moneda" class="w-4 h-4 text-gray-400"></span><b class="w-36">Monto de este pago:</b> ${{ Number(comprobante.monto).toLocaleString('es-CL') }}</div>
            <div class="flex items-center gap-3 px-4 py-2"><span v-html="ICONOS.check" class="w-4 h-4 text-gray-400"></span><b class="w-36">Total pagado:</b> ${{ detalle.totalPagado.toLocaleString('es-CL') }}</div>
            <div class="flex items-center gap-3 px-4 py-2"><span v-html="ICONOS.nota" class="w-4 h-4 text-gray-400"></span><b class="w-36">Saldo pendiente:</b> ${{ detalle.saldoPendiente.toLocaleString('es-CL') }}</div>
            <div class="flex items-center gap-3 px-4 py-2"><span v-html="ICONOS.tarjeta" class="w-4 h-4 text-gray-400"></span><b class="w-36">Medio de pago:</b> {{ comprobante.medio_pago }}</div>
            <div v-if="comprobante.numero_operacion" class="flex items-center gap-3 px-4 py-2"><span v-html="ICONOS.intercambio" class="w-4 h-4 text-gray-400"></span><b class="w-36">N° de operación:</b> {{ comprobante.numero_operacion }}</div>
            <div v-if="comprobante.boleta_sii" class="flex items-center gap-3 px-4 py-2"><span v-html="ICONOS.nota" class="w-4 h-4 text-gray-400"></span><b class="w-36">N° de boleta SII:</b> {{ comprobante.boleta_sii }}</div>
            <div v-if="comprobante.medio_pago === 'Transferencia' && comprobante.transferencia_nombre" class="flex items-center gap-3 px-4 py-2"><span v-html="ICONOS.intercambio" class="w-4 h-4 text-gray-400"></span><b class="w-36">Transferido por:</b> {{ comprobante.transferencia_nombre }}</div>
            <div class="flex items-center gap-3 px-4 py-2"><span v-html="ICONOS.calendario" class="w-4 h-4 text-gray-400"></span><b class="w-36">Fecha de pago:</b> {{ formatearFecha(comprobante.created_at.slice(0,10)) }}</div>
          </div>
        </div>

        <div v-if="textoComprobante" class="bg-gray-50 rounded-lg p-4 mb-4 text-sm flex items-start gap-3">
          <span v-html="ICONOS.nota" class="w-4 h-4 text-gray-400 mt-0.5"></span>
          <p>{{ textoComprobante }}</p>
        </div>

        <div class="grid grid-cols-2 gap-8 mt-auto pt-10 text-center text-sm">
          <div><div class="border-t border-gray-400 pt-1">Firma del alumno</div></div>
          <div><div class="border-t border-gray-400 pt-1">Firma Prevenseg Capacitación</div></div>
        </div>

        <div class="border-t mt-6 pt-3 flex justify-between items-center text-[11px] text-gray-400">
          <div>
            <p class="font-semibold text-gray-500">Prevenseg Capacitación</p>
            <p class="italic">Comprometidos con tu desarrollo</p>
          </div>
          <p>www.prevenseg.cl</p>
        </div>

        <div class="flex justify-end gap-2 mt-6 print:hidden">
          <button @click="imprimirComprobante" class="px-4 py-2 rounded-lg bg-primary-600 text-white">Imprimir</button>
          <button @click="comprobante = null" class="px-4 py-2 rounded-lg text-gray-600">Cerrar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../lib/api.js';
import { normalizarSiEsRut } from '../lib/rut.js';
import { claseBadgeEstado } from '../lib/avatar.js';
import { formatearFecha } from '../lib/fecha.js';
import AvatarBadge from '../components/AvatarBadge.vue';

const s = (inner) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
const ICONOS = {
  persona: s('<circle cx="12" cy="8" r="4"/><path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8"/>'),
  idCard: s('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="12" r="2"/><path d="M15 10h4M15 14h4M5 17h4"/>'),
  calendario: s('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/>'),
  gorro: s('<path d="M12 3l10 5-10 5L2 8z"/><path d="M6 10.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-5.5"/>'),
  check: s('<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>'),
  nota: s('<path d="M5 3h11l3 3v15H5z"/><path d="M16 3v3h3M8 12h8M8 16h5"/>'),
  moneda: s('<circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.3c0-1.2 1.2-2.1 2.5-2.1s2.5.8 2.5 2-1.2 1.8-2.5 2.1-2.5.9-2.5 2.1 1.2 2 2.5 2 2.5-.9 2.5-2.1"/>'),
  tarjeta: s('<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>'),
  intercambio: s('<path d="M4 8h13l-3-3M20 16H7l3 3"/>')
};

const buscar = ref('');
const resultados = ref([]);
const detalle = ref(null);
const comprobante = ref(null);
const textoComprobante = ref('');
const form = ref({ medio_pago: '' });
const modoBusqueda = ref('alumno');

function cambiarModo(modo) {
  modoBusqueda.value = modo;
  detalle.value = null;
  comprobante.value = null;
  resultados.value = [];
  buscar.value = '';
}
const cursos = ref([]);
const cursoListado = ref('');
const listadoCurso = ref([]);

const usuario = JSON.parse(localStorage.getItem('prevenseg_usuario') || '{}');
const esAdmin = usuario.rol === 'administrador';

async function cargarListadoCurso() {
  detalle.value = null;
  comprobante.value = null;
  if (!cursoListado.value) return;
  const { data } = await api.get(`/pagos/curso/${cursoListado.value}`);
  listadoCurso.value = data;
}

async function seleccionarDesdeListado(alumno) {
  modoBusqueda.value = 'alumno';
  buscar.value = `${alumno.nombres} ${alumno.apellido_paterno}`;
  form.value = { medio_pago: '', alumno_id: alumno.id, curso_id: alumno.curso_id };
  await cargarDetalle(alumno.id);
}

async function buscarAlumnos() {
  const { data } = await api.get('/alumnos', { params: { buscar: normalizarSiEsRut(buscar.value) } });
  resultados.value = data;
}

async function seleccionar(alumno) {
  resultados.value = [];
  buscar.value = `${alumno.nombres} ${alumno.apellido_paterno}`;
  form.value = { medio_pago: '', alumno_id: alumno.id, curso_id: alumno.curso_id };
  await cargarDetalle(alumno.id);
}

async function cargarDetalle(alumnoId) {
  const { data } = await api.get(`/pagos/alumno/${alumnoId}`);
  detalle.value = data;
}

async function registrarPago() {
  await api.post('/pagos', form.value);
  const alumnoId = form.value.alumno_id;
  form.value = { medio_pago: '', alumno_id: alumnoId, curso_id: form.value.curso_id };
  cargarDetalle(alumnoId);
}

async function anular(pago) {
  const motivo = prompt('Motivo de la anulación:');
  if (!motivo) return;
  await api.put(`/pagos/${pago.id}/anular`, { motivo });
  cargarDetalle(detalle.value.alumno.id);
}

async function imprimir(pago) {
  const { data } = await api.get('/pagos/config/texto-comprobante');
  textoComprobante.value = data.texto;
  comprobante.value = pago;
}

function imprimirComprobante() {
  window.print();
}

onMounted(async () => {
  const { data } = await api.get('/cursos');
  cursos.value = data;
});
</script>
