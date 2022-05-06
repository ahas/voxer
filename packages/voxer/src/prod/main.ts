import { app, BrowserWindow } from "electron";
import { resolve } from "path";

function createWindow() {
    const config = require("./voxer.config.json");
    const { main } = require("./dist/main.js");
    const win = new BrowserWindow({
        ...config.window,
        webPreferences: {
            preload: __dirname + "/preload.js",
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    win.loadFile(resolve(__dirname, "index.html"));

    main(win);
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
