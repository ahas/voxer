import vue from "@vitejs/plugin-vue";
import type { UserConfig } from "voxer";

export default {
  vite: {
    plugins: [vue()],
    define: {
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
    },
  },
  build: {
    appId: "io.ahas.voxer",
    productName: "voxer",
    copyright: "Copyright © 2022 ahas",
    mac: {
      category: "public.app-category.developer-tools",
    },
    linux: {
      target: ["AppImage"],
    },
    win: {
      target: ["portable"],
    },
    nsis: {
      oneClick: false,
      allowToChangeInstallationDirectory: true,
    },
  },
} as UserConfig;
