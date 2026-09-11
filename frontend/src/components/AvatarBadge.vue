<template>
  <div class="rounded-full flex items-center justify-center font-medium flex-shrink-0" :class="[color.bg, color.text, sizeClass]">
    {{ iniciales(nombre) }}
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { iniciales, colorAvatar } from '../lib/avatar.js';

const props = defineProps({
  nombre: { type: String, default: '' },
  size: { type: String, default: 'md' }
});

const color = computed(() => colorAvatar(props.nombre));
const sizeClass = computed(() => ({ sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-14 h-14 text-lg' }[props.size]));
</script>
