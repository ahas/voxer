import { IpcMain } from "electron";
import { MainWindow } from "./windows";

class VoxerMainProcess {
  win!: MainWindow;
  ipcMain!: IpcMain;
  injectables: Function[] = [];
  instances: Object[] = [];

  invoke<T>(eventName: string, ...args: any[]): Promise<T> {
    return new Promise((resolve) => {
      this.ipcMain.once(`$voxer:main:${eventName}`, (_, arg0) => {
        resolve(arg0);
      });
      this.win.handle.webContents.send(`$voxer:renderer:${eventName}`, ...args);
    });
  }

  handle<T>(eventName: string, listener: (...args: any[]) => T): this {
    if (this.ipcMain.listenerCount(eventName) > 0) {
      console.info(`[Voxer:main] Event "${eventName}" is already listening, method will be skipped`);
      return this;
    }

    this.ipcMain.on.call(this.ipcMain, `$voxer:main:${eventName}`, async (e, ...args) => {
      e.returnValue = await listener(...args);
    });

    return this;
  }

  receive<T>(name: string, ...args: any[]): Promise<T> {
    return new Promise((resolve) => {
      this.ipcMain.once(`$voxer:main:receive:${name}`, (_, arg0) => {
        resolve(arg0);
      });
      this.win.handle.webContents.send(`$voxer:renderer:serve:${name}`, ...args);
    });
  }

  serve<T>(name: string, listener: (...args: any[]) => T): this {
    if (this.ipcMain.listenerCount(name) > 0) {
      console.info(`[Voxer:main] Serve event "${name}" is already listening, method will be skipped`);
      return this;
    }

    this.ipcMain.on.call(this.ipcMain, `$voxer:main:serve:${name}`, async (e, ...args) => {
      e.returnValue = await listener(...args);
    });

    return this;
  }
}

export const voxer = new VoxerMainProcess();
