require("reflect-metadata");
require("./lib/inject");
const { ipcRenderer } = require("electron");
const { VoxerEventEmitter } = require("./lib/events");

// Init preloader and configuration
global.__VOXER_PRELOAD__ = true;

const { contextBridge } = require("electron");

window.addEventListener("DOMContentLoaded", () => {});

// Voxer framework initialization
const events = new VoxerEventEmitter();

ipcRenderer.on("voxer:renderer", (_, channel, ...args) => {
    events.emit(channel, ...args);
});

contextBridge.exposeInMainWorld("voxer", {
    events: {
        on: events.on.bind(events),
        once: events.once.bind(events),
        off: events.off.bind(events),
        send: ipcRenderer.send.bind(ipcRenderer),
        sendSync: ipcRenderer.sendSync.bind(ipcRenderer),
        invoke: ipcRenderer.invoke.bind(ipcRenderer),
        handle: (eventName, listener) => {
            ipcRenderer.on.call(ipcRenderer, "voxer:renderer:" + eventName, (_, ...args) => {
                let result = listener(...args);
                result = Array.isArray(result) ? result : [result];
                ipcRenderer.send("voxer:main:" + eventName, ...result);
            });
        },
    },
});

const { inject: getInjectables, preload } = require("./templates/main");
preload?.();

if (getInjectables) {
    const injectables = getInjectables();

    for (const injectable of injectables) {
        const api = {};

        for (const method of injectable.__exposedMethods) {
            api[method] = (...args) => ipcRenderer.invoke(injectable.name + "." + method, ...args);
        }

        contextBridge.exposeInMainWorld(injectable.name, api);
    }
}
