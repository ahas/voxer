<template>
  <h1>{{ msg }}</h1>

  <div class="buttons">
    <button type="button" @click="count++">count is {{ count }}</button>
    <button type="button" @click="App.maximize()">Maximize</button>
    <button type="button" @click="App.unmaximize()">Minimize</button>
    <button type="button" @click="App.showMenu()">Show Menu</button>
    <button type="button" @click="App.hideMenu()">Hide Menu</button>
  </div>

  <div class="card">
    <p>{{ msgFromServer }}</p>
    <p>
      Edit
      <code>components/HelloWorld.vue</code> to test HMR
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

defineProps<{ msg: string }>();

const { App } = window;

const count = ref(0);

const msgFromServer = ref("");
</script>

<style scoped>
.read-the-docs {
  color: #888;
}

.buttons {
  display: flex;
  flex-wrap: wrap;
  margin-top: 16px;
}

.buttons > *:not(:first-child) {
  margin-left: 8px;
}
</style>
