<template>
  <div v-if="esLogin">
    <router-view />
  </div>
  <div v-else-if="esAlumno">
    <router-view />
  </div>
  <div v-else class="flex">
    <Sidebar class="print:hidden" />
    <div class="flex-1 min-w-0">
      <TopBar class="print:hidden" />
      <router-view />
    </div>
  </div>
  <BarraProgreso class="print:hidden" />
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import Sidebar from './components/Sidebar.vue';
import TopBar from './components/TopBar.vue';
import BarraProgreso from './components/BarraProgreso.vue';

const route = useRoute();
const esLogin = computed(() => route.path === '/login');

// Se vuelve a leer en cada cambio de ruta (route.fullPath) para que, apenas el
// alumno inicia sesión y es redirigido, el layout cambie de inmediato sin
// tener que recargar la página a mano.
const usuario = computed(() => {
  void route.fullPath;
  return JSON.parse(localStorage.getItem('prevenseg_usuario') || '{}');
});
const esAlumno = computed(() => usuario.value.rol === 'alumno');
</script>
