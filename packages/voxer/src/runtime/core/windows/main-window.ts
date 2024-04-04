import { BrowserWindow, BrowserWindowConstructorOptions, Menu, MenuItem, MenuItemConstructorOptions } from "electron";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { voxer } from "../voxer.main";

export type MenuTemplate = Array<MenuItemConstructorOptions | MenuItem>;

export class MainWindow {
  handle: BrowserWindow;

  constructor(options?: BrowserWindowConstructorOptions) {
    options ??= {};
    voxer.win = this;

    this.handle = new BrowserWindow({
      ...options,
      webPreferences: {
        preload: resolve(dirname(fileURLToPath(import.meta.url)), "../../../preload.js"),
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        ...(options.webPreferences ?? {}),
      },
    });
  }

  getApplicationMenu() {
    return Menu.getApplicationMenu();
  }

  setApplicationMenu(menuTemplate: MenuTemplate) {
    Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
  }
}
