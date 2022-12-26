require("reflect-metadata");

import { app, BrowserWindow, ipcMain, Menu, dialog, MenuItem } from "electron";
import { resolve as _resolve } from "path";
import {
  INJECTABLE_ACCESSORS_METADATA,
  INJECTABLE_COMMANDS_METADATA,
  INJECTABLE_EXPOSED_METHODS_METADATA,
  INJECTABLE_INSTANCE_METADATA,
  INJECTABLE_INVOKE_HOOK_METADATA,
  INJECTABLE_MENU_ITEMS_METADATA,
  INJECTABLE_OPTIONS_METADATA,
} from "./core/constants";
import { voxer } from "./core/voxer.main";
import { camelcase, asExposeEvent, asMenuEvent, asGetter, asSetter, asAsync, asCommandEvent } from "./core/utils";
import { AccessorMethod, CommandHandler, ExposedMethod, MenuItemHandler, MethodMetadata } from "./core/decorators";
import { InjectableMetadata } from "./injectable";

declare global {
  var __VOXER_MAIN__: boolean;
}

global.__VOXER_MAIN__ = true;

function connectToRenderer<T extends Object>(
  instance: T,
  { methodName, isAsync }: MethodMetadata<T>,
  eventName: string
) {
  const method = (instance[methodName] as Function).bind(instance);

  if (isAsync) {
    ipcMain.handle(eventName, async (_event, ...args) => await method(...args));
  } else {
    ipcMain.on(eventName, (event, ...args) => (event.returnValue = method(...args)));
    ipcMain.handle(asAsync(eventName), async (_event, ...args) => await method(...args));
  }
}

function connectExposedMethods<T extends Object>(injectable: Function, instance: T) {
  const methods: ExposedMethod<T>[] = Reflect.getMetadata(INJECTABLE_EXPOSED_METHODS_METADATA, injectable) || [];

  for (const method of methods) {
    const eventName = asExposeEvent(injectable, method.methodName);

    connectToRenderer(instance, method, eventName);
  }
}

function connectMenuItems<T extends Object>(injectable: Function, instance: T) {
  const methods: MenuItemHandler<T>[] = Reflect.getMetadata(INJECTABLE_MENU_ITEMS_METADATA, injectable) || [];

  for (const { methodName, selector } of methods) {
    const selectors = Array.isArray(selector) ? selector : [selector];
    const method = (instance[methodName] as Function).bind(instance);

    for (const selector of selectors) {
      ipcMain.on(asMenuEvent(selector), (_event, ...args) => method(...args));
    }
  }
}

function connectCommands<T extends Object>(injectable: Function, instance: T) {
  const methods: CommandHandler<T>[] = Reflect.getMetadata(INJECTABLE_COMMANDS_METADATA, injectable) || [];

  for (const method of methods) {
    const eventName = asCommandEvent(injectable, method.methodName);

    connectToRenderer(instance, method, eventName);
  }
}

function connectAccessors<T extends Object>(injectable: Function, instance: T) {
  const accessors: AccessorMethod<T>[] = Reflect.getMetadata(INJECTABLE_ACCESSORS_METADATA, injectable) || [];

  for (const { propertyKey, options } of accessors) {
    const getterEventName = asGetter(injectable, propertyKey);
    const setterEventName = asSetter(injectable, propertyKey);
    const getterName = (options?.getter || options?.as || propertyKey) as keyof T;
    const setterName = (options?.setter || options?.as || propertyKey) as keyof T;

    ipcMain.on(getterEventName, (event) => {
      event.returnValue = instance[getterName];
    });

    ipcMain.on(setterEventName, (event, ...args) => {
      instance[setterName] = args[0];
      event.returnValue = undefined;
    });

    ipcMain.handle(asAsync(getterEventName), () => {
      return instance[getterName];
    });

    ipcMain.handle(asAsync(setterEventName), (_, ...args) => {
      instance[setterName] = args[0];
    });
  }
}

function extendAppMenu(items: MenuItem[]) {
  for (const item of items) {
    if (item.role || item.accelerator || item.id || item.label) {
      const oldClick = item.click;

      item.click = function () {
        item.role && ipcMain.emit(asMenuEvent(`$${item.role}`), item);
        item.accelerator && ipcMain.emit(asMenuEvent(`:${item.accelerator}`));
        item.id && ipcMain.emit(asMenuEvent(`#${item.id}`));
        item.label && ipcMain.emit(asMenuEvent(item.label), item);

        return oldClick?.call(item, ...arguments);
      };
    }

    item.submenu?.items && extendAppMenu(item.submenu.items);
  }
}

function listenOpenFileDialogEvents(win: BrowserWindow) {
  ipcMain.on("$voxer:main:open-file", (event, options) => {
    event.returnValue = dialog.showOpenDialogSync(win, options);
  });
}

function initVoxerEvents() {
  listenOpenFileDialogEvents(voxer.win.handle);

  ipcMain.on("$voxer:injectables", (event) => {
    const result: InjectableMetadata[] = [];

    for (const injectable of voxer.injectables) {
      const options = Reflect.getMetadata(INJECTABLE_OPTIONS_METADATA, injectable) || {};
      const apiKey = options.as || camelcase(injectable.name);
      const methods = Reflect.getMetadata(INJECTABLE_EXPOSED_METHODS_METADATA, injectable) || [];
      const hooks = Reflect.getMetadata(INJECTABLE_INVOKE_HOOK_METADATA, injectable) || [];
      const commands = Reflect.getMetadata(INJECTABLE_COMMANDS_METADATA, injectable) || [];
      const accessors = Reflect.getMetadata(INJECTABLE_ACCESSORS_METADATA, injectable) || [];

      result.push({
        name: injectable.name,
        apiKey,
        methods,
        hooks,
        commands,
        accessors,
      });
    }

    event.returnValue = result;
  });
}

async function injectDependencies() {
  for (const injectable of voxer.injectables) {
    const instance = Reflect.getMetadata(INJECTABLE_INSTANCE_METADATA, injectable);

    connectExposedMethods(injectable, instance);
    connectAccessors(injectable, instance);
    connectCommands(injectable, instance);
    connectMenuItems(injectable, instance);
  }
}

async function createWindow() {
  const resolve = require("./loaders/resolve");
  const { main } = require("../dist/src/main");
  voxer.ipcMain = ipcMain;
  injectDependencies();
  initVoxerEvents();

  await main(resolve);

  const appMenu = Menu.getApplicationMenu();
  appMenu?.items && extendAppMenu(appMenu.items);

  if (!voxer.win.handle.webContents.getURL()) {
    require("./loaders/load").load(voxer.win);
  }
}

(async () => {
  app.whenReady().then(async () => {
    const { launch } = require("../dist/src/main");
    await launch?.();

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
})();
