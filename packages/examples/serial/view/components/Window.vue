<template>
  <div class="window">
    <div :class="['title-bar', ...titlebarClasses]" @click="isFocused = true">
      <div class="title-bar-text">
        <slot name="title" />
      </div>
      <div class="title-bar-controls">
        <button aria-label="Minimize" @click="minimize()"></button>
        <button
          :aria-label="isMaximized ? 'Restore' : 'Maximize'"
          @click="isMaximized ? restore() : maximize()"
        ></button>
        <button aria-label="Close" @click="close()"></button>
      </div>
    </div>
    <div class="window-body flex-1">
      <slot />
    </div>
    <div class="status-bar flex">
      <slot name="statusbar" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from "vue";

const isFocused = ref(true);
const isMaximized = ref(false);
const isMinimized = ref(false);

const titlebarClasses = computed(() => [
  "flex-none",
  {
    inactive: !isFocused.value,
  },
]);

function maximize() {}
function minimize() {}
function restore() {}
function close() {}
</script>

<style scoped>
.window {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
}

.title-bar {
  user-select: none;
  -webkit-app-region: drag;
}

.title-bar-controls {
  -webkit-app-region: none;
}
</style>
