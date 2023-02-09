<template>
  <h1>VOXER</h1>
  <button id="counter" type="button" @click="count = app.getValue()">{{ count }}</button>
  <button v-for="btn in buttons" :id="btn.id" @click="btn.click()">
    {{ btn.id }}
  </button>
  <p id="message">{{ msg }}</p>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive } from "vue";

const { app, dep } = window;

const msg = ref("");
const count = ref(0);

const buttons = reactive([
  { id: "reset", click: () => app.setValue(0) },
  { id: "maximize", click: () => app.maximize() },
  { id: "unmaximize", click: () => app.unmaximize() },
  { id: "show_menu", click: () => app.showMenu() },
  { id: "hide_menu", click: () => app.hideMenu() },
  { id: "call-dep-async", click: () => app.callDepAsync() },
  { id: "call-dep-async-directly", click: () => dep.getAsyncMessage(), },
  { id: "call-dep-sync", click: () => app.callDepSync(), },
  { id: "call-dep-sync-directly", click: () => dep.getSyncMessage(), },
  { id: "call-dep-sync-async", click: () => app.callDepSyncAsync(), },
  { id: "call-dep-sync-directly-async", click: () => dep.getSyncMessageAsync() },
  { id: "print-object-type", click: () => printInstanceOf(app.createObject(), Object), },
  { id: "print-buffer-type", click: () => printInstanceOf(app.createBuffer(), Uint8Array) },
  { id: "print-date-type", click: () => printInstanceOf(app.createDate(), Date) },
  { id: "print-vec2-type", click: () => console.log(app.createVec2()) },
]);

// Methods
voxer.handle("count", (v) => (count.value = v));
voxer.handle("message", (v) => (msg.value = v));

function printInstanceOf(value: any, type: any) {
  msg.value = (value instanceof type).toString();
}

// Hooks
onMounted(async () => {
});
</script>
