import { BrowserWindow, Menu } from "electron";
import { App } from "./app";

export async function main(win: BrowserWindow) {
  win.setTitle("VOXER (react)");
  win.setSize(800, 600);

  const menu = Menu.buildFromTemplate([
    { role: "fileMenu", submenu: [{ label: "Open", accelerator: "CommandOrControl+O" }] },
    { role: "viewMenu" },
  ]);

  Menu.setApplicationMenu(menu);
}

export function preload() {}

export function inject() {
  return [App];
}
