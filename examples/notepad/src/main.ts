import { BrowserWindow, Menu } from "electron";
import { App } from "./app";
import { Sub } from "./sub";
import { buildAppMenu } from "./menu";

export async function main(win: BrowserWindow) {
  win.setTitle("NotePad");
  win.setSize(800, 600);
  Menu.setApplicationMenu(buildAppMenu());
}

export function preload() {}

export function inject() {
  return [App, Sub];
}
