import type { UserConfig } from "voxer";
import vue from "@vitejs/plugin-vue";

export default <UserConfig>{
    vite: {
        plugins: [vue()],
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
