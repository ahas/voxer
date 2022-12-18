import { MainWindow } from "../core/windows";

export function load(win: MainWindow): void {
  if (process.env.NODE_ENV === "development") {
    const config = require("../../dist/voxer.config.js");

    win.handle.loadURL(`http://localhost:${config.vite?.port || 5173}`);
  } else {
    const { resolve } = require("./resolve");

    win.handle.loadFile(resolve("index.html"));
  }
}
