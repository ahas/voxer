import { BrowserWindow } from "electron";

export function main(win: BrowserWindow) {
  win.setTitle("Voxer + Lit");
  win.setSize(640, 480);
}
