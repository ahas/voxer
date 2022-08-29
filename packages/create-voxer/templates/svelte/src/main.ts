import { BrowserWindow, Menu } from "electron";
import { App } from "./app";
import { voxer } from "#app";

export async function main(win: BrowserWindow) {
  win.setTitle("Voxer + Vue (TS)");
  win.setSize(800, 600);

  const menu = Menu.buildFromTemplate([
    {
      label: "Call",
      click: async () => {
        const result = await voxer.invoke(win, "add", 1, 2, 3);
        console.log(result);
      },
    },
    {
      role: "viewMenu",
    },
  ]);

  win.setMenu(menu);
}

export function preload() {}

export function inject() {
  return [App];
}
