const { ipcMain } = require("electron");
const { EventEmitter } = require("events");

class VoxerEventEmitter extends EventEmitter {}

module.exports.VoxerEventEmitter = VoxerEventEmitter;

module.exports.voxer = {
    invoke(win, eventName, ...args) {
        return new Promise((resolve) => {
            ipcMain.once("voxer:main:" + eventName, (_, ...args) => {
                resolve(args);
            });
            win.webContents.send("voxer:renderer:" + eventName, ...args);
        });
    },
};
