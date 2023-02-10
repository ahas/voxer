import type { InjectableMetadata } from "./injectable";

import { ipcRenderer, contextBridge } from "electron";
import { voxer } from "./core/voxer.renderer";
import { camelcase, asExposeEvent, asGetter, asSetter, asAsync, asCommandEvent } from "./core/utils";
import type { Mousetrap } from "mousetrap";

declare global {
  var __VOXER_PRELOAD__: boolean;

  interface Window {
    sendMessage(rpg: string, arg: any): void;
  }
}

// Init preloader and configuration
global.__VOXER_PRELOAD__ = true;
window.addEventListener("DOMContentLoaded", () => {});

function exposeVoxer() {
  contextBridge.exposeInMainWorld("voxer", voxer);
}

function connectExposedMethods(injectable: InjectableMetadata) {
  const api: any = {};
  const methods = injectable.methods;

  for (const { methodName, isAsync } of methods) {
    const eventName = asExposeEvent(injectable, methodName);

    if (isAsync) {
      api[methodName] = (...args: any[]) => {
        ipcRenderer.invoke(eventName, ...args);
      };
    } else {
      api[methodName] = (...args: any[]) => ipcRenderer.sendSync(eventName, ...args);
      api[String(methodName) + "Async"] = (...args: any[]) => ipcRenderer.invoke(asAsync(eventName), ...args);
    }
  }

  return api;
}

function connectCommandMethods(injectable: InjectableMetadata) {
  const api = {};
  const methods = injectable.commands;

  if (methods.length > 0) {
    const Mousetrap = require("mousetrap").default as Mousetrap;

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

function connectAccessors(injectable: InjectableMetadata) {
  const api: any = {};
  const accessors = injectable.accessors;

  for (const { propertyKey, options } of accessors) {
    const getterName = options?.getter || camelcase("get", String(options?.as || propertyKey || ""));
    const setterName = options?.setter || camelcase("set", String(options?.as || propertyKey || ""));

    api[getterName] = () => ipcRenderer.sendSync(asGetter(injectable, propertyKey));
    api[getterName + "Async"] = () => ipcRenderer.invoke(asAsync(asGetter(injectable, propertyKey)));
    api[setterName] = (v: any) => ipcRenderer.sendSync(asSetter(injectable, propertyKey), v);
    api[setterName + "Async"] = (v: any) => ipcRenderer.invoke(asAsync(asSetter(injectable, propertyKey)), v);
  }

  return api;
}

function exposeInjectables() {
  const injectables: InjectableMetadata[] = ipcRenderer.sendSync("$voxer:injectables");

  for (const injectable of injectables) {
    const api = {
      ...connectExposedMethods(injectable),
      ...connectAccessors(injectable),
      ...connectCommandMethods(injectable),
    };

    contextBridge.exposeInMainWorld(injectable.apiKey, api);
  }
}

(async () => {
  exposeVoxer();
  // #!if IS_PRELOAD_DEFINED
  try {
    // @ts-ignore
    const { preload } = await import("~/preload");
    await preload();
  } catch {
    console.info("No user preload detected");
  }
  // #!endif

  exposeInjectables();
})();
