// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  extends: "@nuxt-themes/docus",
  modules: ["@vueuse/nuxt", "@nuxt/content"],
  build: {
    transpile: ["vuetify"],
  },
});
