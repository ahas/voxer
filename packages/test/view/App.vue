<template>
  <h1>VOXER</h1>
  <button id="counter" type="button" @click="count = app.getValue()">{{ count }}</button>
  <button id="reset" type="button" @click="app.setValue(0)">Reset</button>
  <button id="maximize" type="button" @click="app.maximize()">Maximize</button>
  <button id="unmaximize" type="button" @click="app.unmaximize()">Unmaximize</button>
  <button id="show_menu" type="button" @click="app.showMenu()">Show menu</button>
  <button id="hide_menu" type="button" @click="app.hideMenu()">Hide menu</button>
  <button id="call-dep" type="button" @click="app.callDependency()">Call dependency</button>
  <button id="call-dep-directly" type="button" @click="dep.foo()">Call dependency directly</button>
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

onMounted(async () => {});
</script>
