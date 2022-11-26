<template>
  <div class="notepad">
    <div class="lines">
      <div v-for="i in lines" class="line-no">{{ i }}</div>
    </div>
    <textarea v-model="content" spellcheck="false" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";

const content = ref("");
const lines = computed(() => content.value.split(/\r\n|\r|\n/).length || 1);

$voxer
  .serve("content", () => content.value)
  .handle("set-content", (v) => (content.value = v));
</script>

<style scoped>
.notepad {
  display: flex;
  overflow-y: visible;
  min-height: 100%;
}

.notepad .lines {
  padding: 8px;
  color: #000;
  border-right: 1px dashed #000;
  background-color: #fff;
  flex: 0;
  user-select: none;
}

.notepad textarea {
  outline: 0;
  border: 0;
  padding: 8px;
  flex: 1;
  overflow: hidden;
  resize: none;
}

@media print {
  .notepad .lines {
    display: none !important;
  }
}
</style>
