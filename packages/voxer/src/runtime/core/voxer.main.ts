import { IpcMain } from "electron";
import { consoleError } from "./console";
import { INJECTABLE_INSTANCE_METADATA, INJECTABLE_OPTIONS_METADATA } from "./constants";
import { MainWindow } from "./windows";

const __circularInjection = new Map<string, boolean>();

class VoxerMainProcess {
  win!: MainWindow;
  ipcMain!: IpcMain;
  injectables: Function[] = [];
  instances: Object[] = [];

  inject<T extends Object>(injectable: { new (...args: any[]): T }): T {
    const found = this.instances.find((x) => x instanceof injectable);

    if (found) {
      return found as T;
    }

    const name = injectable.name;

    if (__circularInjection.get(name)) {
      consoleError("Circular dependency injection detected: %s", name);
    }

    __circularInjection.set(name, true);
    const paramTypes = Reflect.getMetadata("design:paramtypes", injectable);
    const options = Reflect.getMetadata(INJECTABLE_OPTIONS_METADATA, injectable);
    const args: any = [];

    if (paramTypes) {
      for (const paramType of paramTypes) {
        const arg = options.inject.find((x: any) => x === paramType);

        if (arg) {
          args.push(this.inject(arg));
        } else {
          args.push(undefined);
        }
      }
    }

    const instance = new injectable(...args);
    Reflect.defineMetadata(INJECTABLE_INSTANCE_METADATA, instance, injectable);
    this.injectables.push(injectable);
    this.instances.push(instance);

    __circularInjection.set(name, false);

    return instance;
  }

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
