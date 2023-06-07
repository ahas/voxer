import type { InjectableMetadata } from "./injectable";

import { ipcRenderer, contextBridge } from "electron";
import { voxer } from "./core/voxer.renderer";
import { camelcase, asExposeEvent, asGetter, asSetter, asAsync, asCommandEvent } from "./core/utils";

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
      api[methodName] = async (...args: any[]) => {
        try {
          return await ipcRenderer.invoke(eventName, ...args);
        } catch (e) {
          throw e;
        }
      };
    } else {
      api[methodName] = (...args: any[]) => {
        try {
          return ipcRenderer.sendSync(eventName, ...args);
        } catch (e) {
          throw e;
        }
      };
      api[String(methodName) + "Async"] = async (...args: any[]) => {
        try {
          return await ipcRenderer.invoke(asAsync(eventName), ...args);
        } catch (e) {
          throw e;
        }
      };
    }
  }

  return api;
}

async function connectCommandMethods(injectable: InjectableMetadata) {
  const api = {};
  const methods = injectable.commands;

  if (methods.length > 0) {
    const Mousetrap = (await import("mousetrap")).default;

    for (const { methodName, isAsync, combinations } of methods) {
      const eventName = asCommandEvent(injectable, methodName);

      if (isAsync) {
        Mousetrap.bind(combinations, () => {
          ipcRenderer.invoke(eventName).catch((e) => {
            throw e;
          });
        });
      } else {
        Mousetrap.bind(combinations, () => {
          try {
            ipcRenderer.sendSync(eventName);
          } catch (e) {
            throw e;
          }
        });
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

    api[getterName] = () => {
      try {
        return ipcRenderer.sendSync(asGetter(injectable, propertyKey));
      } catch (e) {
        throw e;
      }
    };
    api[getterName + "Async"] = async () => {
      try {
        return await ipcRenderer.invoke(asAsync(asGetter(injectable, propertyKey)));
      } catch (e) {
        throw e;
      }
    };
    api[setterName] = (v: any) => {
      try {
        return ipcRenderer.sendSync(asSetter(injectable, propertyKey), v);
      } catch (e) {
        throw e;
      }
    };
    api[setterName + "Async"] = async (v: any) => {
      try {
        return ipcRenderer.invoke(asAsync(asSetter(injectable, propertyKey)), v);
      } catch (e) {
        throw e;
      }
    };
  }

  return api;
}

async function exposeInjectables() {
  const injectables: InjectableMetadata[] = ipcRenderer.sendSync("$voxer:injectables");

  for (const injectable of injectables) {
    const api = {
      ...connectExposedMethods(injectable),
      ...connectAccessors(injectable),
      ...(await connectCommandMethods(injectable)),
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

  await exposeInjectables();
})();
