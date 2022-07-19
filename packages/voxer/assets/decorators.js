const { INJECTABLE_MARK, INJECTABLE_OPTIONS_METADATA, INJECTED_INSTANCE_METADATA } = require("./constants");
const { ipcRenderer, ipcMain } = require("electron");

function Injectable(options) {
    return function (target) {
        Reflect.defineMetadata(INJECTABLE_MARK, true, target);
        Reflect.defineMetadata(INJECTABLE_OPTIONS_METADATA, options, target);
    };
}

function Expose(options) {
    options = options || {};
    options.api = options.api || "api";

    return function (target, methodName) {
        if (!target.constructor.__exposedMethods) {
            target.constructor.__exposedMethods = [];
        }

        target.constructor.__exposedMethods.push(methodName);
    };
}

function OnRenderer(channel) {
    return function (target, methodName) {
        ipcRenderer.on(channel, (event, ...args) => {
            const instance = Reflect.getMetadata(INJECTED_INSTANCE_METADATA, injectable);
            instance[methodName].call(instance, ...args);
        });
    };
}

function OnMain(channel) {
    return function (target, methodName) {
        ipcMain.on(channel, (event, ...args) => {
            const instance = Reflect.getMetadata(INJECTED_INSTANCE_METADATA, injectable);
            instance[methodName].call(instance, ...args);
        });
    };
}

module.exports.Injectable = Injectable;
module.exports.Expose = Expose;
module.exports.OnRenderer = OnRenderer;
module.exports.ONMain = OnMain;
