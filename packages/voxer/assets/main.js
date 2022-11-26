require("reflect-metadata");
const { app, BrowserWindow, ipcMain, Menu } = require("electron");
const { resolve: _resolve } = require("path");
const { INJECTED_INSTANCE_METADATA } = require("./lib/constants");
const { voxer } = require("./lib/serverside");
const { asExposeEvent, asMenuEvent, asGetter, asSetter, asAsync, asCommandEvent } = require("./lib/utils");

global.__VOXER_MAIN__ = true;

function connectExposedMethods(injectable, instance) {
  const methods = injectable.__exposedMethods || [];

  for (const { methodName, isAsync } of methods) {
    const eventName = asExposeEvent(injectable, methodName);
    const method = instance[methodName].bind(instance);

    if (isAsync) {
      ipcMain.handle(eventName, async (event, ...args) => {
        return await method(...args);
      });
    } else {
      ipcMain.on(eventName, (event, ...args) => {
        event.returnValue = method(...args);
      });
      ipcMain.handle(asAsync(eventName), async (event, ...args) => {
        return await method(...args);
      });
    }
  }
}

function connectMenus(injectable, instance) {
  const methods = injectable.__menuMethods || [];

  for (const { methodName, selector } of methods) {
    const eventName = asMenuEvent(selector);
    const method = instance[methodName].bind(instance);

    ipcMain.on(eventName, () => method());
  }
}

function connectCommands(injectable, instance) {
  const methods = injectable.__commandMethods || [];

  for (const { methodName, isAsync } of methods) {
    const eventName = asCommandEvent(injectable, methodName);
    const method = instance[methodName].bind(instance);

    if (isAsync) {
      ipcMain.handle(eventName, async (event) => {
        return await method();
      });
    } else {
      ipcMain.on(eventName, (event) => {
        event.returnValue = method();
      });
    }
  }
}

function connectAccessors(injectable, instance) {
  const accessors = injectable.__accessors || [];

  for (const { propertyKey, options } of accessors) {
    const getterEventName = asGetter(injectable, propertyKey);
    const setterEventName = asSetter(injectable, propertyKey);
    const getterName = options?.getter || options?.as || propertyKey;
    const setterName = options?.setter || options?.as || propertyKey;

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

function extendAppMenu(items) {
  for (const item of items) {
    if (item.role || item.accelerator || item.id || item.label) {
      const oldClick = item.click;

      item.click = function () {
        item.role && ipcMain.emit(`$voxer:menu:$${item.role}`, item);
        item.accelerator && ipcMain.emit(`$voxer:menu::${item.accelerator}`);
        item.id && ipcMain.emit(`$voxer:menu:#${item.id}`);
        item.label && ipcMain.emit(`$voxer:menu:${item.label}`, item);

        return oldClick?.call(item, ...arguments);
      };
    }

    item.submenu?.items && extendAppMenu(item.submenu.items);
  }
}

async function createWindow() {
  const resolve = require("./templates/resolve");
  const { main, inject } = require("./templates/main");
  const injectables = (await require("./lib/inject")(inject)) || [];

  for (const injectable of injectables) {
    const instance = Reflect.getMetadata(INJECTED_INSTANCE_METADATA, injectable);

    connectExposedMethods(injectable, instance);
    connectAccessors(injectable, instance);
    connectCommands(injectable, instance);
    connectMenus(injectable, instance);
  }

  const win = new BrowserWindow({
    webPreferences: {
      preload: __dirname + "/preload.js",
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  voxer.win = win;
  voxer.ipcMain = ipcMain;

  await main(win, resolve);

  const appMenu = Menu.getApplicationMenu();
  appMenu?.items && extendAppMenu(appMenu.items);

  if (!win.webContents.getURL()) {
    require("./templates/load").load(win);
  }
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
