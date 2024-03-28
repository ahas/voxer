import { BrowserWindow, Menu, MenuItemConstructorOptions, BrowserWindowConstructorOptions, MenuItem } from "electron";
import { voxer } from "../voxer.main";
import { resolve } from "node:path";

export type MenuTemplate = Array<MenuItemConstructorOptions | MenuItem>;

export class MainWindow {
  handle: BrowserWindow;

  constructor(options?: BrowserWindowConstructorOptions) {
    voxer.win = this;

    this.handle = new BrowserWindow({
      webPreferences: {
        preload: resolve(import.meta.dirname, "../../preload.js"),
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
      },
      ...(options || {}),
    });
  }

  getApplicationMenu() {
    return Menu.getApplicationMenu();
  }

  setApplicationMenu(menuTemplate: MenuTemplate) {
    Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
  }
}
