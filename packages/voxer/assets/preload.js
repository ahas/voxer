require("reflect-metadata");
require("./lib/inject");

const { ipcRenderer, contextBridge } = require("electron");
const { VoxerEventEmitter } = require("./lib/events");
const { INJECTED_INSTANCE_METADATA } = require("./lib/constants");
const { inject: getInjectables, preload } = require("./templates/main");
const Mousetrap = require("mousetrap");

// Init preloader and configuration
global.__VOXER_PRELOAD__ = true;

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

preload?.();

if (getInjectables) {
  const injectables = getInjectables();

  for (const injectable of injectables) {
    const api = {};

    for (const method of injectable.__exposedMethods) {
      api[method] = (...args) => ipcRenderer.invoke(injectable.name + "." + method, ...args);
    }

    for (const command of injectable.__commandMethods) {
      const instance = Reflect.getMetadata(INJECTED_INSTANCE_METADATA, injectable);
      const method = injectable?.prototype?.[command[0]].bind(instance);
      Mousetrap.bind(command[1], method);

      if (typeof command[0] === "string") {
        api["cmd:" + command[0]] = method;
      } else if (Array.isArray(command[0])) {
        for (const cmd of command[0]) {
          api["cmd:" + cmd] = method;
        }
      }
    }

    contextBridge.exposeInMainWorld(injectable.name, api);
  }
}
