module.exports = {
    window: {
        title: "Voxer",
        width: 800,
        height: 600,
    },
    vite: {
        build: {
            lib: {
                entry: "view/my-element.js",
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
