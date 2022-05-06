<template>
    <main>
        <div>Hello, {{ title }} !</div>
    </main>
</template>

<script setup lang="ts">
import { ref } from "vue";
const title = ref(voxer.title);
</script>

<style>
#app {
    width: 100%;
    height: 100%;
    user-select: none;
}
</style>
