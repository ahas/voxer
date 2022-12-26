<template>
  <h1>VOXER</h1>

  <div class="buttons">
    <button type="button" @click="count = app.getValue()">Increase<br />Count = {{ count }}</button>
    <button type="button" @click="app.setValue(0)">Reset</button>
    <button type="button" @click="app.maximize()">Maximize</button>
    <button type="button" @click="app.unmaximize()">Unmaximize</button>
    <button type="button" @click="app.callDependency()">Call dependency</button>
  </div>

  <div class="card">
    <p>Message: {{ msg }}</p>
    <p>
      Edit
      <code>view/components/HelloWorld.vue</code> to test HMR
    </p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";

const { app, dep } = window;

const msg = ref("");
const count = ref(0);

voxer.handle("count", (v) => (count.value = v));
voxer.handle("message", (v) => (msg.value = v));

onMounted(async () => {});
</script>

<style scoped>
.buttons {
  display: flex;
  flex-wrap: wrap;
  margin-top: 16px;
}

.buttons > *:not(:first-child) {
  margin-left: 8px;
}
</style>
