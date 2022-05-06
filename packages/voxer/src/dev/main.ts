import { app, BrowserWindow } from "electron";

function createWindow() {
    const config = require("./dist/voxer.config.js").default;
    const { main } = require("./dist/main.js");
    const win = new BrowserWindow({
        ...config.window,
        webPreferences: {
            preload: __dirname + "/preload.js",
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    win.loadURL("http://localhost:3000");

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
