require("reflect-metadata");
const { app, BrowserWindow, ipcMain } = require("electron");
const { resolve: _resolve } = require("path");
const { INJECTED_INSTANCE_METADATA } = require("./lib/constants");

global.__VOXER_MAIN__ = true;

async function createWindow() {
    const win = new BrowserWindow({
        webPreferences: {
            preload: __dirname + "/preload.js",
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    const resolve = require("./templates/resolve");
    const { main, inject } = require("./templates/main");

    await main(win, resolve);
    const injectables = await require("./lib/inject")(inject);

    for (const injectable of injectables) {
        for (const method of injectable.__exposedMethods) {
            const eventName = injectable.name + "." + method;

            ipcMain.handle(eventName, async (event, ...args) => {
                const instance = Reflect.getMetadata(INJECTED_INSTANCE_METADATA, injectable);
                return await instance[method](...args);
            });
        }
    }

    if (!win.webContents.getURL()) {
        require("./templates/load").load(win);
    }
}

app.whenReady().then(() => {
    createWindow();
    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});
