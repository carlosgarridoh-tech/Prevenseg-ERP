<template>
  <nav class="bg-white text-primary-700 px-6 py-3 flex items-center justify-between shadow border-b-2 border-primary-500">
    <div class="flex items-center gap-6">
      <img src="../assets/logo.png" alt="Prevenseg" class="h-8" />
      <router-link to="/dashboard" class="text-sm text-gray-600 hover:text-primary-600">Dashboard</router-link>
      <router-link to="/alumnos" class="text-sm text-gray-600 hover:text-primary-600">Alumnos</router-link>
      <router-link to="/cursos" class="text-sm text-gray-600 hover:text-primary-600">Cursos</router-link>
      <router-link to="/pagos" class="text-sm text-gray-600 hover:text-primary-600">Pagos</router-link>
      <router-link to="/relatores" class="text-sm text-gray-600 hover:text-primary-600">Relatores</router-link>
      <router-link to="/horarios" class="text-sm text-gray-600 hover:text-primary-600">Horarios</router-link>
      <router-link to="/documentos" class="text-sm text-gray-600 hover:text-primary-600">Documentos</router-link>
      <router-link to="/notificaciones" class="text-sm text-gray-600 hover:text-primary-600">Notificaciones</router-link>
      <router-link to="/reportes" class="text-sm text-gray-600 hover:text-primary-600">Reportes</router-link>
      <router-link to="/ajustes" class="text-sm text-gray-600 hover:text-primary-600">Ajustes</router-link>
    </div>
    <button @click="salir" class="text-sm bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded">
      Cerrar sesión
    </button>
  </nav>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

function salir() {
  localStorage.removeItem('prevenseg_token');
  router.push('/login');
}
</script>
