const { ipcRenderer } = require("electron");
const { VoxerEventEmitter } = require("./serverside");

const emitter = new VoxerEventEmitter();

ipcRenderer.on("$voxer:renderer", (_, channel, ...args) => {
  emitter.emit(channel, ...args);
});

const voxer = {};
voxer.handle = (eventName, listener) => {
  if (ipcRenderer.listenerCount(eventName) > 0) {
    console.info(`[Voxer:renderer] Event "${eventName}" is already listening, method will be skipped`);
    return voxer;
  }

  ipcRenderer.on.call(ipcRenderer, `$voxer:renderer:${eventName}`, async (_, ...args) => {
    const result = await listener(...args);

    ipcRenderer.send(`$voxer:main:${eventName}`, result);
  });

  return voxer;
};
voxer.serve = (name, listener) => {
  if (ipcRenderer.listenerCount(name) > 0) {
    console.info(`[Voxer:renderer] Serve event "${name}" is already listening, method will be skipped`);
    return voxer;
  }

  ipcRenderer.on.call(ipcRenderer, `$voxer:renderer:serve:${name}`, async (_, ...args) => {
    const result = await listener(...args);

    ipcRenderer.send(`$voxer:main:receive:${name}`, result);
  });

  return voxer;
};
voxer.receive = (name, ...args) => ipcRenderer.sendSync(`$voxer:main:serve:${name}`, ...args);
voxer.on = emitter.on.bind(voxer);
voxer.once = emitter.once.bind(voxer);
voxer.off = emitter.off.bind(voxer);
voxer.send = ipcRenderer.send.bind(voxer);
voxer.sendSync = ipcRenderer.sendSync.bind(voxer);
voxer.invoke = ipcRenderer.invoke.bind(voxer);

module.exports.voxer = voxer;
