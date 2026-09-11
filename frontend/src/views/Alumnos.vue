<template>
  <div class="p-8">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-3xl font-bold text-primary-700">Alumnos</h1>
        <p class="text-sm text-gray-500">Gestión de matrículas e inscripciones</p>
      </div>
      <button @click="nuevoAlumno" class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm">
        + Nuevo alumno
      </button>
    </div>

    <div class="flex flex-wrap gap-3 mb-6">
      <input
        v-model="buscar"
        @input="cargarAlumnos"
        placeholder="Buscar por nombre, apellido o RUT..."
        class="flex-1 min-w-[220px] border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
      <select v-model="filtroCurso" class="border rounded-lg px-3 py-2">
        <option value="">Todos los cursos</option>
        <option v-for="c in cursos" :key="c.id" :value="c.id">{{ c.nombre_curso }}</option>
      </select>
      <select v-model="filtroFinanciero" class="border rounded-lg px-3 py-2">
        <option value="">Todos los estados</option>
        <option value="Al día">Al día</option>
        <option value="Pago pendiente">Pago pendiente</option>
        <option value="Moroso">Moroso</option>
      </select>
    </div>

    <div class="bg-white rounded-xl shadow overflow-visible">
      <table class="w-full text-sm">
        <thead class="bg-primary-50 text-primary-700 text-left">
          <tr>
            <th class="px-4 py-3">Alumno</th>
            <th class="px-4 py-3">RUT</th>
            <th class="px-4 py-3">Empresa</th>
            <th class="px-4 py-3">Curso</th>
            <th class="px-4 py-3">Estado</th>
            <th class="px-4 py-3">Financiero</th>
            <th class="px-4 py-3">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="al in alumnosFiltrados" :key="al.id" class="border-t hover:bg-gray-50">
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <AvatarBadge :nombre="al.nombres + ' ' + al.apellido_paterno" size="sm" />
                {{ al.nombres }} {{ al.apellido_paterno }}
              </div>
            </td>
            <td class="px-4 py-3">{{ al.rut }}</td>
            <td class="px-4 py-3">{{ al.nombre_empresa || '—' }}</td>
            <td class="px-4 py-3">{{ al.cursos?.nombre_curso || '—' }}</td>
            <td class="px-4 py-3">
              <span class="px-2 py-1 rounded-full text-xs" :class="claseBadgeEstado(al.estado)">{{ al.estado }}</span>
            </td>
            <td class="px-4 py-3">
              <span class="px-2 py-1 rounded-full text-xs" :class="claseBadgeEstado(estadoFinanciero(al))">{{ estadoFinanciero(al) }}</span>
            </td>
            <td class="px-4 py-3 relative">
              <div class="flex items-center gap-2">
                <button @click="verFicha(al)" class="text-accent hover:underline">Ver ficha</button>
                <button @click="menuAbierto = menuAbierto === al.id ? null : al.id" class="text-gray-500 border rounded px-2 py-0.5 hover:bg-gray-50">⋮</button>
              </div>
              <div v-if="menuAbierto === al.id" class="absolute right-4 top-10 bg-white border rounded-lg shadow-lg z-20 py-1 w-44 text-left">
                <button @click="editar(al); menuAbierto = null" class="block w-full text-left px-3 py-2 hover:bg-gray-50 text-primary-600">Modificar</button>
                <button v-if="esAdmin" @click="quitarAcceso(al); menuAbierto = null" class="block w-full text-left px-3 py-2 hover:bg-gray-50 text-amber-600">Quitar acceso</button>
                <button v-if="esAdmin" @click="abrirAviso(al); menuAbierto = null" class="block w-full text-left px-3 py-2 hover:bg-gray-50 text-orange-600">Enviar aviso</button>
                <button @click="eliminar(al); menuAbierto = null" class="block w-full text-left px-3 py-2 hover:bg-gray-50 text-red-600">Eliminar</button>
                <button @click="menuAbierto = null" class="block w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-500 border-t">Cerrar</button>
              </div>
            </td>
          </tr>
          <tr v-if="!alumnosFiltrados.length">
            <td colspan="7" class="text-center text-gray-400 py-8">No hay alumnos que coincidan con el filtro</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Crear/Modificar -->
    <div v-if="mostrarModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 overflow-y-auto py-8">
      <form @submit.prevent="guardar" class="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl my-auto">
        <h2 class="text-lg font-semibold text-primary-700 mb-4">{{ form.id ? 'Modificar' : 'Nuevo' }} alumno</h2>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs text-gray-500">Nombres</label>
            <input v-model="form.nombres" required class="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label class="text-xs text-gray-500">Apellido paterno</label>
            <input v-model="form.apellido_paterno" required class="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label class="text-xs text-gray-500">Apellido materno</label>
            <input v-model="form.apellido_materno" class="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label class="text-xs text-gray-500">RUT</label>
            <input v-model="form.rut" @blur="validarRutForm" placeholder="12345678-9" required class="w-full border rounded-lg px-3 py-2" />
            <p v-if="errorRut" class="text-red-600 text-xs mt-1">{{ errorRut }}</p>
          </div>
          <div>
            <label class="text-xs text-gray-500">Fecha de nacimiento</label>
            <input v-model="form.fecha_nacimiento" type="date" class="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label class="text-xs text-gray-500">Teléfono</label>
            <div class="flex gap-1">
              <select v-model="prefijoTelefono" class="border rounded-lg px-2 py-2 text-sm w-24">
                <option value="+56">🇨🇱 +56</option>
                <option value="+54">🇦🇷 +54</option>
                <option value="+51">🇵🇪 +51</option>
                <option value="+57">🇨🇴 +57</option>
                <option value="+591">🇧🇴 +591</option>
                <option value="+1">🇺🇸 +1</option>
              </select>
              <input
                v-model="telefonoNumeros"
                @input="telefonoNumeros = telefonoNumeros.replace(/[^0-9]/g, '')"
                inputmode="numeric"
                placeholder="Solo números"
                class="flex-1 border rounded-lg px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label class="text-xs text-gray-500">Correo electrónico</label>
            <input v-model="form.correo" class="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label class="text-xs text-gray-500">Dirección</label>
            <input v-model="form.direccion" class="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label class="text-xs text-gray-500">Comuna</label>
            <input v-model="form.comuna" class="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label class="text-xs text-gray-500">Tipo de empresa</label>
            <select v-model="form.tipo_empresa" class="w-full border rounded-lg px-3 py-2">
              <option disabled value="">Selecciona</option>
              <option>Particular</option>
              <option>Sence</option>
              <option>No sence</option>
            </select>
          </div>
          <div>
            <label class="text-xs text-gray-500">Nombre empresa</label>
            <input v-model="form.nombre_empresa" class="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label class="text-xs text-gray-500">Fecha de inscripción</label>
            <input v-model="form.fecha_inscripcion" type="date" class="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label class="text-xs text-gray-500">Estado</label>
            <select v-model="form.estado" class="w-full border rounded-lg px-3 py-2">
              <option>Activo</option>
              <option>No iniciado</option>
              <option>Finalizado</option>
              <option>Cancelado</option>
            </select>
          </div>
          <div class="col-span-2">
            <label class="text-xs text-gray-500">Curso a inscribir</label>
            <select v-model="form.curso_id" class="w-full border rounded-lg px-3 py-2">
              <option disabled value="">Selecciona</option>
              <option v-for="c in cursos" :key="c.id" :value="c.id">{{ c.nombre_curso }}</option>
            </select>
          </div>
          <div class="col-span-2">
            <label class="text-xs text-gray-500">Observación (opcional)</label>
            <textarea v-model="form.observacion" rows="2" placeholder="Ej: motivo de retiro, situación especial..." class="w-full border rounded-lg px-3 py-2"></textarea>
          </div>
        </div>
        <div class="flex justify-end gap-2 mt-5">
          <button type="button" @click="mostrarModal = false" class="px-4 py-2 rounded-lg text-gray-600">Cancelar</button>
          <button type="submit" class="px-4 py-2 rounded-lg bg-primary-600 text-white">Guardar</button>
        </div>
      </form>
    </div>

    <!-- Modal Ficha -->
    <div v-if="fichaAlumno" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 overflow-y-auto py-8">
      <div class="bg-white rounded-xl p-8 w-full max-w-xl shadow-xl flex flex-col relative overflow-hidden print:flex print:flex-col" id="ficha-imprimible">
        <div class="absolute top-0 left-0 w-16 h-16 bg-slate-800" style="clip-path: polygon(0 0, 100% 0, 0 100%)"></div>
        <div class="absolute bottom-0 right-0 w-16 h-16 bg-primary-600" style="clip-path: polygon(100% 100%, 0 100%, 100% 0)"></div>

        <div class="flex justify-between items-start relative z-10">
          <div>
            <img src="../assets/logo.png" alt="Prevenseg" class="h-14" />
            <p class="text-[10px] tracking-widest text-gray-400 mt-1 ml-1">FORMACIÓN PARA UN TRABAJO MÁS SEGURO</p>
          </div>
          <div class="border-2 border-primary-600 rounded-lg px-4 py-1.5 text-center">
            <p class="text-xl font-extrabold text-primary-600 leading-none">N° {{ String(fichaAlumno.correlativo || fichaAlumno.id).padStart(4, '0') }}</p>
            <p class="text-[10px] font-medium text-gray-500 tracking-wide">MATRÍCULA</p>
          </div>
        </div>

        <div class="flex items-center gap-3 my-5">
          <div class="h-px bg-gray-300 flex-1"></div>
          <h2 class="text-lg font-bold text-slate-800 whitespace-nowrap">FICHA DE <span class="text-primary-600">ALUMNO</span></h2>
          <div class="h-px bg-gray-300 flex-1"></div>
        </div>

        <div class="bg-gray-100 rounded-lg py-3 px-4 mb-5">
          <h1 class="text-2xl font-extrabold text-primary-600 text-center uppercase leading-tight">
            {{ fichaAlumno.nombres }} {{ fichaAlumno.apellido_paterno }} {{ fichaAlumno.apellido_materno }}
          </h1>
        </div>

        <div class="rounded-lg overflow-hidden border mb-4">
          <div class="bg-primary-600 text-white text-sm font-semibold px-4 py-2 flex items-center gap-2">
            <span v-html="ICONOS.persona" class="w-4 h-4"></span> DATOS PERSONALES
          </div>
          <div class="divide-y text-sm">
            <div class="flex items-center gap-3 px-4 py-2"><span v-html="ICONOS.idCard" class="w-4 h-4 text-gray-400"></span><b class="w-40">RUT:</b> {{ fichaAlumno.rut }}</div>
            <div class="flex items-center gap-3 px-4 py-2"><span v-html="ICONOS.calendario" class="w-4 h-4 text-gray-400"></span><b class="w-40">Fecha de nacimiento:</b> {{ fichaAlumno.fecha_nacimiento ? formatearFecha(fichaAlumno.fecha_nacimiento) : '—' }}</div>
            <div class="flex items-center gap-3 px-4 py-2"><span v-html="ICONOS.telefono" class="w-4 h-4 text-gray-400"></span><b class="w-40">Teléfono:</b> {{ fichaAlumno.telefono || '—' }}</div>
            <div class="flex items-center gap-3 px-4 py-2"><span v-html="ICONOS.correo" class="w-4 h-4 text-gray-400"></span><b class="w-40">Correo:</b> {{ fichaAlumno.correo || '—' }}</div>
            <div class="flex items-center gap-3 px-4 py-2"><span v-html="ICONOS.pin" class="w-4 h-4 text-gray-400"></span><b class="w-40">Dirección:</b> {{ fichaAlumno.direccion || '—' }}</div>
            <div class="flex items-center gap-3 px-4 py-2"><span v-html="ICONOS.mapa" class="w-4 h-4 text-gray-400"></span><b class="w-40">Comuna:</b> {{ fichaAlumno.comuna || '—' }}</div>
          </div>
        </div>

        <div class="rounded-lg overflow-hidden border mb-4">
          <div class="bg-slate-800 text-white text-sm font-semibold px-4 py-2 flex items-center gap-2">
            <span v-html="ICONOS.libro" class="w-4 h-4"></span> INFORMACIÓN DE CAPACITACIÓN
          </div>
          <div class="divide-y text-sm">
            <div class="flex items-center gap-3 px-4 py-2"><span v-html="ICONOS.edificio" class="w-4 h-4 text-gray-400"></span><b class="w-40">Tipo de empresa:</b> {{ fichaAlumno.tipo_empresa || '—' }}</div>
            <div class="flex items-center gap-3 px-4 py-2"><span v-html="ICONOS.edificio" class="w-4 h-4 text-gray-400"></span><b class="w-40">Empresa:</b> {{ fichaAlumno.nombre_empresa || '—' }}</div>
            <div class="flex items-center gap-3 px-4 py-2"><span v-html="ICONOS.gorro" class="w-4 h-4 text-gray-400"></span><b class="w-40">Curso:</b> {{ fichaAlumno.cursos?.nombre_curso || '—' }}</div>
            <div class="flex items-center gap-3 px-4 py-2"><span v-html="ICONOS.calendario" class="w-4 h-4 text-gray-400"></span><b class="w-40">Fecha de inscripción:</b> {{ fichaAlumno.fecha_inscripcion ? formatearFecha(fichaAlumno.fecha_inscripcion) : '—' }}</div>
            <div class="flex items-center gap-3 px-4 py-2"><span v-html="ICONOS.check" class="w-4 h-4 text-gray-400"></span><b class="w-40">Estado:</b> {{ fichaAlumno.estado }}</div>
          </div>
        </div>

        <div v-if="fichaAlumno.observacion" class="bg-gray-50 rounded-lg p-4 mb-4 text-sm flex items-start gap-3">
          <span v-html="ICONOS.nota" class="w-4 h-4 text-gray-400 mt-0.5"></span>
          <div><b>Observación:</b> {{ fichaAlumno.observacion }}</div>
        </div>

        <div class="border-t mt-auto pt-3 flex justify-between items-center text-[11px] text-gray-400">
          <div>
            <p class="font-semibold text-gray-500">Prevenseg Capacitación</p>
            <p class="italic">Comprometidos con tu desarrollo</p>
          </div>
          <p>www.prevenseg.cl</p>
        </div>

        <div class="flex justify-end gap-2 mt-6 print:hidden">
          <button @click="imprimir" class="px-4 py-2 rounded-lg bg-accent text-white">Imprimir ficha</button>
          <button @click="fichaAlumno = null" class="px-4 py-2 rounded-lg text-gray-600">Cerrar</button>
        </div>
      </div>
    </div>

    <!-- Modal Enviar aviso -->
    <div v-if="alumnoAviso" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <form @submit.prevent="enviarAviso" class="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
        <h2 class="text-lg font-semibold text-primary-700 mb-4">Enviar aviso a {{ alumnoAviso.nombres }}</h2>
        <label class="text-xs text-gray-500">Tipo</label>
        <select v-model="formAviso.nivel" class="w-full border rounded-lg px-3 py-2 mb-3">
          <option value="info">Informativo</option>
          <option value="advertencia">Advertencia (se destaca en rojo)</option>
        </select>
        <label class="text-xs text-gray-500">Mensaje</label>
        <textarea v-model="formAviso.mensaje" rows="3" required placeholder="Ej: Debes regularizar tu pago antes del inicio del curso" class="w-full border rounded-lg px-3 py-2 mb-4"></textarea>
        <div class="flex justify-end gap-2">
          <button type="button" @click="alumnoAviso = null" class="px-4 py-2 rounded-lg text-gray-600">Cancelar</button>
          <button type="submit" class="px-4 py-2 rounded-lg bg-primary-600 text-white">Enviar</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import api from '../lib/api.js';
import { validarRut, formatearRut, normalizarSiEsRut } from '../lib/rut.js';
import { claseBadgeEstado } from '../lib/avatar.js';
import { estadoFinancieroAlumno } from '../lib/finanzas.js';
import { formatearFecha } from '../lib/fecha.js';
import AvatarBadge from '../components/AvatarBadge.vue';

// Íconos simples en línea usados en la ficha de impresión
const s = (inner) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
const ICONOS = {
  persona: s('<circle cx="12" cy="8" r="4"/><path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8"/>'),
  idCard: s('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="12" r="2"/><path d="M15 10h4M15 14h4M5 17h4"/>'),
  calendario: s('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/>'),
  telefono: s('<path d="M5 4h3l2 5-2 1a11 11 0 006 6l1-2 5 2v3a2 2 0 01-2 2C10.5 21 3 13.5 3 6a2 2 0 012-2z"/>'),
  correo: s('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>'),
  pin: s('<path d="M12 21s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>'),
  mapa: s('<path d="M9 4l-6 2v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>'),
  libro: s('<path d="M4 5c3-1.5 6-1.5 8 0v14c-2-1.5-5-1.5-8 0V5z"/><path d="M20 5c-3-1.5-6-1.5-8 0v14c2-1.5 5-1.5 8 0V5z"/>'),
  edificio: s('<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2"/>'),
  gorro: s('<path d="M12 3l10 5-10 5L2 8z"/><path d="M6 10.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-5.5"/>'),
  check: s('<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>'),
  nota: s('<path d="M5 3h11l3 3v15H5z"/><path d="M16 3v3h3M8 12h8M8 16h5"/>'),
  moneda: s('<circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.3c0-1.2 1.2-2.1 2.5-2.1s2.5.8 2.5 2-1.2 1.8-2.5 2.1-2.5.9-2.5 2.1 1.2 2 2.5 2 2.5-.9 2.5-2.1"/>'),
  tarjeta: s('<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>'),
  intercambio: s('<path d="M4 8h13l-3-3M20 16H7l3 3"/>')
};

const alumnos = ref([]);
const cursos = ref([]);
const buscar = ref('');
const filtroCurso = ref('');
const filtroFinanciero = ref('');
const mostrarModal = ref(false);
const fichaAlumno = ref(null);
const form = ref({});
const errorRut = ref('');
const prefijoTelefono = ref('+56');
const telefonoNumeros = ref('');
const menuAbierto = ref(null);
const usuario = JSON.parse(localStorage.getItem('prevenseg_usuario') || '{}');
const esAdmin = usuario.rol === 'administrador';

// Calcula Al día / Pago pendiente / Moroso a partir de los pagos reales del alumno
function estadoFinanciero(alumno) {
  return estadoFinancieroAlumno(alumno) || '—';
}

const alumnosFiltrados = computed(() =>
  alumnos.value.filter((al) => {
    if (filtroCurso.value && al.curso_id !== filtroCurso.value) return false;
    if (filtroFinanciero.value && estadoFinanciero(al) !== filtroFinanciero.value) return false;
    return true;
  })
);

function validarRutForm() {
  if (!form.value.rut) return;
  if (!validarRut(form.value.rut)) {
    errorRut.value = 'El RUT ingresado no es válido (revisa el dígito verificador)';
  } else {
    errorRut.value = '';
    form.value.rut = formatearRut(form.value.rut);
  }
}

async function cargarAlumnos() {
  const { data } = await api.get('/alumnos', { params: { buscar: normalizarSiEsRut(buscar.value) } });
  alumnos.value = data;
}

async function cargarCursos() {
  const { data } = await api.get('/cursos');
  cursos.value = data;
}

const PREFIJOS = ['+56', '+54', '+51', '+57', '+591', '+1'];

function nuevoAlumno() {
  form.value = { estado: 'Activo', fecha_inscripcion: new Date().toISOString().slice(0, 10) };
  prefijoTelefono.value = '+56';
  telefonoNumeros.value = '';
  mostrarModal.value = true;
}

function editar(al) {
  form.value = { ...al, cursos: undefined, pagos: undefined };
  const prefijoEncontrado = PREFIJOS.find((p) => al.telefono?.startsWith(p));
  prefijoTelefono.value = prefijoEncontrado || '+56';
  telefonoNumeros.value = al.telefono ? al.telefono.replace(prefijoEncontrado || '', '').replace(/[^0-9]/g, '') : '';
  mostrarModal.value = true;
}

async function verFicha(al) {
  const { data } = await api.get(`/alumnos/${al.id}`);
  fichaAlumno.value = data;
}

async function guardar() {
  validarRutForm();
  if (errorRut.value) return;
  form.value.telefono = telefonoNumeros.value ? `${prefijoTelefono.value}${telefonoNumeros.value}` : '';
  try {
    if (form.value.id) {
      await api.put(`/alumnos/${form.value.id}`, form.value);
    } else {
      const { data } = await api.post('/alumnos', form.value);
      if (data.cuentaPortalCreada) {
        alert(`Se creó la cuenta del Portal del Alumno.\nUsuario: ${data.correo}\nClave inicial: su RUT sin puntos ni guión (${data.rut.replace(/[^0-9kK]/g, '')})`);
      }
    }
    mostrarModal.value = false;
    cargarAlumnos();
  } catch (e) {
    alert(e.response?.data?.error || 'No se pudo guardar el alumno.');
  }
}

async function eliminar(al) {
  if (!confirm(`¿Eliminar a ${al.nombres}?`)) return;
  await api.delete(`/alumnos/${al.id}`);
  cargarAlumnos();
}

async function quitarAcceso(al) {
  if (!confirm(`¿Quitar el acceso al portal de ${al.nombres}? (útil cuando termina el curso)`)) return;
  try {
    await api.delete(`/alumnos/${al.id}/acceso`);
    alert('Acceso eliminado correctamente.');
  } catch (e) {
    alert(e.response?.data?.error || 'Este alumno no tenía una cuenta de portal activa.');
  }
}

function imprimir() {
  window.print();
}

const alumnoAviso = ref(null);
const formAviso = ref({ nivel: 'info', mensaje: '' });

function abrirAviso(al) {
  alumnoAviso.value = al;
  formAviso.value = { nivel: 'info', mensaje: '' };
}

async function enviarAviso() {
  await api.post(`/alumnos/${alumnoAviso.value.id}/avisos`, formAviso.value);
  alumnoAviso.value = null;
  alert('Aviso enviado. El alumno lo verá al entrar a su portal.');
}

onMounted(() => {
  cargarAlumnos();
  cargarCursos();
});
</script>
