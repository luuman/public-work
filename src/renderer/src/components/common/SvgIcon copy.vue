<template>
  <svg
    v-if="iconContent"
    :class="['svg-icon', $attrs.class]"
    :width="size"
    :height="size"
    aria-hidden="true"
    v-html="iconContent"
    :style="{ fill: color }"
  ></svg>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue';

// props
interface Props {
  name: string; // 图标文件名，不带 .svg
  size?: string | number;
  color?: string;
}

const props = withDefaults(defineProps<Props>(), {
  size: '1em',
  color: 'currentColor',
});

// 自动导入 icons 目录下所有 svg
const modules = import.meta.glob('@/assets/icons/*.svg', { as: 'raw' });

const iconContent = ref('');

watchEffect(async () => {
  const path = `/src/assets/icons/${props.name}.svg`;
  if (modules[path]) {
    iconContent.value = await modules[path]();
  } else {
    console.warn(`SVG icon not found: ${props.name}`);
    iconContent.value = '';
  }
});
</script>

<style scoped>
.svg-icon {
  display: inline-block;
  vertical-align: middle;
}
</style>
