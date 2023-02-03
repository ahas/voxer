<template>
  <h1>VOXER</h1>
  <button id="counter" type="button" @click="count = app.getValue()">{{ count }}</button>
  <button id="reset" type="button" @click="app.setValue(0)">Reset</button>
  <button id="maximize" type="button" @click="app.maximize()">Maximize</button>
  <button id="unmaximize" type="button" @click="app.unmaximize()">Unmaximize</button>
  <button id="show_menu" type="button" @click="app.showMenu()">Show menu</button>
  <button id="hide_menu" type="button" @click="app.hideMenu()">Hide menu</button>
  <button id="call-dep-async" type="button" @click="app.callDepAsync()">Call dep async</button>
  <button id="call-dep-async-directly" type="button" @click="dep.getAsyncMessage()">Call dep async directly</button>
  <button id="call-dep-sync" type="button" @click="app.callDepSync()">Call dep sync</button>
  <button id="call-dep-sync-directly" type="button" @click="dep.getSyncMessage()">Call dep sync directly</button>
  <button id="call-dep-sync-async" type="button" @click="app.callDepSyncAsync()">Call dep sync</button>
  <button id="call-dep-sync-directly-async" type="button" @click="dep.getSyncMessageAsync()">Call dep sync directly</button>
  <p id="message">{{ msg }}</p>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";

const { app, dep } = window;
console.log("App", window);

const msg = ref("");
const count = ref(0);

voxer.handle("count", (v) => (count.value = v));
voxer.handle("message", (v) => (msg.value = v));

onMounted(async () => {
  console.log(app.createBuffer().buffer);
});
</script>
