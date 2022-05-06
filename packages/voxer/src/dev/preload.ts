import { contextBridge } from "electron";

let config = require("./dist/voxer.config.js");
if (config.default) {
    config = config.default;
}

window.addEventListener("DOMContentLoaded", () => {});

contextBridge.exposeInMainWorld("voxer", {
    title: config.window?.title,
});
