import { MainWindow } from "../core/windows/main-window";

export async function load(win: MainWindow): Promise<void> {
  if (process.env.NODE_ENV === "development") {
    // @ts-expect-error
    const config = await import("../../dist/voxer.config");
    win.handle.loadURL(`http://localhost:${config.vite?.port || 5173}`);
  } else {
    win.handle.loadFile(".voxer/index.html");
  }
}
