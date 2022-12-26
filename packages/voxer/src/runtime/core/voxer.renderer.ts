import { ipcRenderer } from "electron";

export interface VoxerRendererProcess {
  dependencies: Function[];
  handle<T>(eventName: string, listener: (...args: any[]) => T): this;
  serve<T>(name: string, listener: (...args: any[]) => T): this;
  receive<T>(name: string, ...args: any[]): T;
  send(channel: string, ...args: any[]): void;
  sendSync<T = void>(channel: string, ...args: any[]): T;
  invoke(channel: string, ...args: any[]): Promise<any>;
  openFileDialog(options?: Electron.OpenDialogSyncOptions): string;
};

export const voxer: VoxerRendererProcess = {
  dependencies: [],
  handle(eventName, listener) {
    if (ipcRenderer.listenerCount(eventName) > 0) {
      console.info(`[Voxer:renderer] Event "${eventName}" is already listening, method will be skipped`);
      return this;
    }

    ipcRenderer.on.call(ipcRenderer, `$voxer:renderer:${eventName}`, async (_, ...args) => {
      const result = await listener(...args);

      ipcRenderer.send(`$voxer:main:${eventName}`, result);
    });

    return voxer;
  },
  serve(name, listener) {
    if (ipcRenderer.listenerCount(name) > 0) {
      console.info(`[Voxer:renderer] Serve event "${name}" is already listening, method will be skipped`);

      return this;
    }

    ipcRenderer.on.call(ipcRenderer, `$voxer:renderer:serve:${name}`, async (_, ...args) => {
      const result = await listener(...args);

      ipcRenderer.send(`$voxer:main:receive:${name}`, result);
    });

    return voxer;
  },
  receive(name, ...args) {
    return ipcRenderer.sendSync(`$voxer:main:serve:${name}`, ...args);
  },
  send(channel, ...args: any[]): void {
    ipcRenderer.send(channel, ...args);
  },
  sendSync(channel, ...args) {
    return ipcRenderer.sendSync(channel, ...args);
  },
  invoke(channel, ...args) {
    return ipcRenderer.invoke(channel, ...args);
  },
  openFileDialog(options) {
    return ipcRenderer.sendSync(`$voxer:main:open-file`, options);
  }
};
