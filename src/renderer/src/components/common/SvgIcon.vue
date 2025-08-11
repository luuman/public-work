<!-- src/components/SvgIcon.vue -->
<template>
  <svg :class="['svg-icon', className]" aria-hidden="true" v-bind="attrs">
    <use :xlink:href="`#icon-${name}`" />
  </svg>
</template>

<script setup lang="ts">
import { useAttrs } from 'vue';

interface Props {
  name: string;
  className?: string;
}

const props = defineProps<Props>();
const attrs = useAttrs();
</script>

<style scoped>
.svg-icon {
  width: 1em;
  height: 1em;
  fill: currentColor;
  vertical-align: middle;
}
</style>
