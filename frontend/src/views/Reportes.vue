<template>
  <div class="p-8">
    <div class="flex items-center justify-between mb-1">
      <div>
        <h1 class="text-3xl font-bold text-primary-700">Reportes</h1>
        <p class="text-sm text-gray-500">Financieros y operacionales</p>
      </div>
      <div class="flex gap-2">
        <button @click="exportarPagoCompleto('excel')" class="bg-accent hover:opacity-90 text-white px-4 py-2 rounded-lg text-sm">Reporte pago completo (Excel)</button>
        <button @click="exportar('excel')" class="bg-white border border-primary-500 text-primary-600 px-4 py-2 rounded-lg text-sm">Exportar a Excel</button>
        <button @click="exportar('pdf')" class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm">Exportar a PDF</button>
      </div>
    </div>
    <div class="mb-5"></div>

    <div class="flex gap-2 mb-6">
      <button
        v-for="t in tabs"
        :key="t.tipo"
        @click="cambiarTab(t.tipo)"
        class="px-4 py-2 rounded-lg text-sm border"
        :class="tabActual === t.tipo ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 text-gray-600'"
      >
        {{ t.label }}
      </button>
    </div>

    <div class="bg-primary-50 rounded-xl p-5 mb-6 inline-block">
      <p class="text-sm text-gray-500">{{ tabActualInfo.totalLabel }}</p>
      <p class="text-2xl font-semibold text-primary-700">${{ (datos.total || 0).toLocaleString('es-CL') }}</p>
    </div>

    <div v-if="tabActual === 'ingresos' && datos.porCurso?.length" class="bg-white rounded-xl shadow p-5 mb-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-medium text-gray-600">Ingreso esperado vs. pagado por curso</h3>
        <div class="flex items-center gap-4 text-xs text-gray-500">
          <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-sm bg-primary-600 inline-block"></span> Pagado</span>
          <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-sm bg-gray-200 inline-block"></span> Pendiente</span>
        </div>
      </div>
      <div class="flex items-end gap-6 h-40 overflow-x-auto pb-1">
        <div v-for="c in datos.porCurso" :key="c.curso" class="flex flex-col justify-end flex-shrink-0 w-14 h-full">
          <div class="relative w-full rounded-t overflow-hidden bg-gray-200" :style="{ height: (c.esperado / maxEsperado) * 100 + '%' }">
            <div class="absolute bottom-0 left-0 right-0 bg-primary-600" :style="{ height: Math.min((c.pagado / c.esperado) * 100, 100) + '%' }"></div>
          </div>
        </div>
      </div>
      <div class="flex gap-6 mt-1 overflow-x-auto">
        <p v-for="c in datos.porCurso" :key="c.curso" class="flex-shrink-0 w-14 text-center text-[11px] text-gray-500 truncate" :title="c.curso">{{ c.curso }}</p>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-primary-50 text-primary-700 text-left">
          <tr><th v-for="c in datos.columnas" :key="c" class="px-4 py-3">{{ c }}</th></tr>
          <tr class="bg-white border-t">
            <th v-for="(c, j) in datos.columnas" :key="'f' + c" class="px-4 py-1.5">
              <select v-model="filtrosColumna[j]" class="w-full border rounded px-1 py-1 text-xs font-normal text-gray-600">
                <option value="">Todos</option>
                <option v-for="valor in valoresUnicos(j)" :key="valor" :value="valor">
                  {{ esColumnaMonto(j) ? '$' + Number(valor).toLocaleString('es-CL') : valor }}
                </option>
              </select>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(fila, i) in filasFiltradas" :key="i" class="border-t">
            <td v-for="(valor, j) in fila" :key="j" class="px-4 py-2">
              {{ esColumnaMonto(j) ? '$' + Number(valor).toLocaleString('es-CL') : valor }}
            </td>
          </tr>
          <tr v-if="!filasFiltradas.length"><td :colspan="datos.columnas ? datos.columnas.length : 1" class="text-center text-gray-400 py-8">Sin movimientos</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../lib/api.js';

const tabs = [
  { tipo: 'ingresos', label: 'Ingresos', totalLabel: 'Ingresos totales' },
  { tipo: 'deudas', label: 'Deudas', totalLabel: 'Deuda total pendiente' },
  { tipo: 'abonos', label: 'Abonos', totalLabel: 'Total abonado' },
  { tipo: 'horas', label: 'Horas relatores', totalLabel: 'Total a pagar a relatores' },
  { tipo: 'pagos-relatores', label: 'Pagos relatores', totalLabel: 'Total pagado a relatores' },
  { tipo: 'consolidado', label: 'Consolidado', totalLabel: 'Total vigente' }
];

const tabActual = ref('ingresos');
const datos = ref({});
const filtrosColumna = ref({});

const tabActualInfo = computed(() => tabs.find((t) => t.tipo === tabActual.value));
const maxEsperado = computed(() => {
  const valores = (datos.value.porCurso || []).map((c) => c.esperado);
  return valores.length ? Math.max(...valores) : 1;
});

function valoresUnicos(j) {
  const filas = datos.value.filas || [];
  return [...new Set(filas.map((f) => String(f[j] ?? '')))].sort();
}

const filasFiltradas = computed(() => {
  const filas = datos.value.filas || [];
  const activos = Object.entries(filtrosColumna.value).filter(([, v]) => v);
  if (!activos.length) return filas;
  return filas.filter((fila) => activos.every(([j, valor]) => String(fila[j] ?? '') === valor));
});

function esColumnaMonto(indice) {
  const nombre = datos.value.columnas?.[indice];
  return ['Monto', 'Valor curso', 'Pagado', 'Saldo pendiente', 'Valor hora', 'Total a pagar'].includes(nombre);
}

async function cambiarTab(tipo) {
  tabActual.value = tipo;
  filtrosColumna.value = {};
  const { data } = await api.get(`/reportes/${tipo}`);
  datos.value = data;
}

async function exportar(formato) {
  const respuesta = await api.get(`/reportes/${tabActual.value}/exportar`, { params: { formato }, responseType: 'blob' });
  const nombre = respuesta.headers['content-disposition']?.match(/filename="(.+)"/)?.[1] || 'reporte';
  const url = URL.createObjectURL(respuesta.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
}

async function exportarPagoCompleto(formato) {
  const respuesta = await api.get('/reportes/pago-completo/exportar', { params: { formato }, responseType: 'blob' });
  const nombre = respuesta.headers['content-disposition']?.match(/filename="(.+)"/)?.[1] || 'reporte-pago-completo';
  const url = URL.createObjectURL(respuesta.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
}

onMounted(() => cambiarTab('ingresos'));
</script>
