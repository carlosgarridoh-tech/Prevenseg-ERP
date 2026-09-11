<template>
  <div v-if="trabajoActivo.visible" class="fixed bottom-5 right-5 bg-white rounded-xl shadow-2xl border p-4 w-80 z-50">
    <div class="flex justify-between items-start mb-2">
      <p class="text-sm font-semibold text-primary-700">{{ trabajoActivo.etiqueta }}</p>
      <button @click="cerrarTrabajo()" class="text-gray-400 hover:text-gray-600 text-sm">✕</button>
    </div>

    <template v-if="trabajoActivo.estado === 'procesando'">
      <div class="w-full bg-gray-200 rounded-full h-2 mb-2 overflow-hidden">
        <div class="bg-primary-600 h-2 transition-all" :style="{ width: porcentaje + '%' }"></div>
      </div>
      <p class="text-xs text-gray-500">{{ trabajoActivo.hechos }} de {{ trabajoActivo.total }} · {{ trabajoActivo.segundos }}s transcurridos</p>
      <p class="text-[11px] text-gray-400 mt-1">Puedes seguir usando el sistema mientras se genera.</p>
    </template>

    <template v-else-if="trabajoActivo.estado === 'listo'">
      <p class="text-sm text-accent">✓ Listo — se descargó automáticamente ({{ trabajoActivo.segundos }}s)</p>
    </template>

    <template v-else-if="trabajoActivo.estado === 'error'">
      <p class="text-sm text-red-600">{{ trabajoActivo.error || 'Ocurrió un error al generar el documento' }}</p>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { trabajoActivo, cerrarTrabajo } from '../lib/trabajos.js';

const porcentaje = computed(() => (trabajoActivo.total ? Math.round((trabajoActivo.hechos / trabajoActivo.total) * 100) : 0));
</script>
