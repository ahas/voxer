import { BrowserWindow } from "electron";

export function main(win: BrowserWindow) {
  win.setTitle("Voxer + Preact");
  win.setSize(640, 480);
}
