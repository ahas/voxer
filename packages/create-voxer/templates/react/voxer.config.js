const react = require("@vitejs/plugin-react");

module.exports = {
    window: {
        title: "Voxer",
        width: 800,
        height: 600,
    },
    vite: {
        plugins: [react()],
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
