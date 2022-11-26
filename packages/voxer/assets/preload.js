require("reflect-metadata");
require("./lib/inject");

const { voxer } = require("./lib/clientside");
const { ipcRenderer, contextBridge } = require("electron");
const { INJECTABLE_OPTIONS_METADATA } = require("./lib/constants");
const { inject: getInjectables, preload } = require("./templates/main");
const { camelcase, asExposeEvent, asGetter, asSetter, asAsync, asCommandEvent } = require("./lib/utils");

// Init preloader and configuration
global.__VOXER_PRELOAD__ = true;
window.addEventListener("DOMContentLoaded", () => {});

function exposeVoxer() {
  contextBridge.exposeInMainWorld("voxer", voxer);
}

function connectExposedMethods(injectable) {
  const api = {};
  const methods = injectable?.__exposedMethods || [];

  for (const { methodName, isAsync } of methods) {
    const eventName = asExposeEvent(injectable, methodName);

    if (isAsync) {
      api[methodName] = (...args) => ipcRenderer.invoke(eventName, ...args);
    } else {
      api[methodName] = (...args) => ipcRenderer.sendSync(eventName, ...args);
      api[methodName + "Async"] = (...args) => ipcRenderer.invoke(asAsync(eventName), ...args);
    }
  }

  return api;
}

function connectCommandMethods(injectable) {
  const api = {};
  const methods = injectable?.__commandMethods || [];

  if (methods.length > 0) {
    const Mousetrap = require("mousetrap");

    for (const { methodName, isAsync, combinations } of methods) {
      const eventName = asCommandEvent(injectable, methodName);

      if (isAsync) {
        Mousetrap.bind(combinations, () => ipcRenderer.invoke(eventName));
      } else {
        Mousetrap.bind(combinations, () => ipcRenderer.sendSync(eventName));
      }
    }
  }

  return api;
}

function connectAccessors(injectable) {
  const api = {};
  const accessors = injectable?.__accessors || [];

  for (const { propertyKey, options } of accessors) {
    const getterName = options?.getter || camelcase("get", options?.as || propertyKey);
    const setterName = options?.setter || camelcase("set", options?.as || propertyKey);

    api[getterName] = () => ipcRenderer.sendSync(asGetter(injectable, propertyKey));
    api[getterName + "Async"] = () => ipcRenderer.invoke(asAsync(asGetter(injectable, propertyKey)));
    api[setterName] = (v) => ipcRenderer.sendSync(asSetter(injectable, propertyKey), v);
    api[setterName + "Async"] = (v) => ipcRenderer.invoke(asAsync(asSetter(injectable, propertyKey)), v);
  }

  return api;
}

function exposeInjectables() {
  getInjectables?.()?.forEach((injectable) => {
    const options = Reflect.getMetadata(INJECTABLE_OPTIONS_METADATA, injectable) || {};

    contextBridge.exposeInMainWorld(options.as || camelcase(injectable.name), {
      ...connectExposedMethods(injectable),
      ...connectAccessors(injectable),
      ...connectCommandMethods(injectable),
    });
  });
}

(() => {
  exposeVoxer();
  preload?.();
  exposeInjectables();
})();
