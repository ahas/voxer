import type { UserConfig } from "voxer";

export default <UserConfig>{
  vite: {
    build: {
      lib: {
        entry: "my-element.ts",
        formats: ["es"],
      },
      rollupOptions: {
        external: /^lit/,
      },
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
};
