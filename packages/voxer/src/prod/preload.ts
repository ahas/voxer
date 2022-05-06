import { contextBridge } from "electron";

const config = require("./voxer.config.json");

window.addEventListener("DOMContentLoaded", () => {});

contextBridge.exposeInMainWorld("voxer", {
    title: config.window?.title,
});
