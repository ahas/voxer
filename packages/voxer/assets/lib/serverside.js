const { EventEmitter } = require("events");

class VoxerEventEmitter extends EventEmitter {}

module.exports.voxer = {
  win: null,
  ipcMain: null,
  invoke(eventName, ...args) {
    return new Promise((resolve) => {
      this.ipcMain.once(`$voxer:main:${eventName}`, (_, arg0) => {
        resolve(arg0);
      });
      this.win.webContents.send(`$voxer:renderer:${eventName}`, ...args);
    });
  },
  handle(eventName, listener) {
    if (this.ipcMain.listenerCount(eventName) > 0) {
      console.info(`[Voxer:main] Event "${eventName}" is already listening, method will be skipped`);
      return this;
    }

    this.ipcMain.on.call(this.ipcMain, `$voxer:main:${eventName}`, async (_, ...args) => {
      e.returnValue = await listener(...args);
    });

    return this;
  },
  receive(name, ...args) {
    return new Promise((resolve) => {
      this.ipcMain.once(`$voxer:main:receive:${name}`, (_, arg0) => {
        resolve(arg0);
      });
      this.win.webContents.send(`$voxer:renderer:serve:${name}`, ...args);
    });
  },
  serve(name, listener) {
    if (this.ipcMain.listenerCount(name) > 0) {
      console.info(`[Voxer:main] Serve event "${name}" is already listening, method will be skipped`);
      return this;
    }

    this.ipcMain.on.call(this.ipcMain, `$voxer:main:serve:${name}`, async (e, ...args) => {
      e.returnValue = await listener(...args);
    });

    return this;
  },
};
module.exports.VoxerEventEmitter = VoxerEventEmitter;
