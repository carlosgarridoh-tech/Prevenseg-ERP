<template>
  <header class="bg-white border-b px-6 py-3 flex items-center justify-between sticky top-0 z-10">
    <div class="relative w-full max-w-sm">
      <input
        v-model="busqueda"
        @keyup.enter="buscar"
        placeholder="Buscar alumno, curso..."
        class="w-full border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
      <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6">
        <circle cx="9" cy="9" r="6" />
        <line x1="14" y1="14" x2="18" y2="18" />
      </svg>
    </div>

    <div class="flex items-center gap-3">
      <AvatarBadge :nombre="usuario.nombre || usuario.email" size="sm" />
      <div class="text-right leading-tight">
        <p class="text-sm font-medium text-gray-700">{{ usuario.nombre || usuario.email }}</p>
        <p class="text-xs text-gray-400 capitalize">{{ usuario.rol }}</p>
      </div>
      <button @click="salir" class="text-sm text-gray-400 hover:text-primary-600 ml-2" title="Cerrar sesión">
        <svg class="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6">
          <path d="M8 3H4.5A1.5 1.5 0 003 4.5v11A1.5 1.5 0 004.5 17H8" />
          <path d="M13 14l4-4-4-4M17 10H7" />
        </svg>
      </button>
    </div>
  </header>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import AvatarBadge from './AvatarBadge.vue';

const router = useRouter();
const usuario = JSON.parse(localStorage.getItem('prevenseg_usuario') || '{}');
const busqueda = ref('');

function buscar() {
  if (!busqueda.value) return;
  router.push('/alumnos');
}

function salir() {
  localStorage.removeItem('prevenseg_token');
  localStorage.removeItem('prevenseg_refresh');
  router.push('/login');
}
</script>
