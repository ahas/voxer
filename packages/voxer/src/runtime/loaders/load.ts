import { MainWindow } from "../core/windows";

export function load(win: MainWindow): void {
  if (process.env.NODE_ENV === "development") {
    const config = require("../../dist/voxer.config");
    win.handle.loadURL(`http://localhost:${config.vite?.port || 5173}`);
  } else {
    win.handle.loadFile(".voxer/index.html");
  }
}
