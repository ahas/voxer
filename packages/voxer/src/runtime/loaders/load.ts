import { MainWindow } from "../core/windows";

export async function load(win: MainWindow): Promise<void> {
  if (process.env.NODE_ENV === "development") {
    // @ts-expect-error
    const config = await import("../../dist/voxer.config.js");

    win.handle.loadURL(`http://localhost:${config.vite?.port || 5173}`);
  } else {
    const { resolve } = await import("./resolve");

    win.handle.loadFile(resolve("index.html"));
  }
}
