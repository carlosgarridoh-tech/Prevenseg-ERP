<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-white to-primary-50">
    <form @submit.prevent="ingresar" class="bg-white shadow-lg rounded-xl p-10 w-full max-w-sm">
      <div class="text-center mb-8">
        <img src="../assets/logo.png" alt="Prevenseg Capacitación" class="h-14 mx-auto mb-2" />
        <h1 class="mt-2 text-lg font-semibold text-primary-700">Sistema de Gestión Integral</h1>
      </div>

      <label class="block text-sm text-gray-600 mb-1">Usuario (correo)</label>
      <input v-model="email" type="email" required class="w-full border rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-primary-500" />

      <label class="block text-sm text-gray-600 mb-1">Contraseña</label>
      <input v-model="password" type="password" required class="w-full border rounded-lg px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-primary-500" />

      <a href="#" class="text-xs text-primary-600 hover:underline block mb-6">¿Olvidaste tu contraseña?</a>

      <p v-if="error" class="text-red-600 text-sm mb-4">{{ error }}</p>

      <button :disabled="cargando" type="submit" class="w-full bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-lg font-medium">
        {{ cargando ? 'Ingresando...' : 'Ingresar' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '../lib/api.js';

const email = ref('');
const password = ref('');
const error = ref('');
const cargando = ref(false);
const router = useRouter();

async function ingresar() {
  error.value = '';
  cargando.value = true;
  try {
    const { data } = await api.post('/auth/login', { email: email.value, password: password.value });
    localStorage.setItem('prevenseg_token', data.token);
    localStorage.setItem('prevenseg_refresh', data.refreshToken);
    localStorage.setItem('prevenseg_usuario', JSON.stringify(data.usuario));
    router.push(data.usuario.rol === 'alumno' ? '/portal' : '/dashboard');
  } catch (e) {
    error.value = e.response?.data?.error || 'Error al iniciar sesión';
  } finally {
    cargando.value = false;
  }
}
</script>
