const { ipcRenderer, ipcMain } = require("electron");
const { INJECTABLE_CONTEXT, INJECTABLE_MARK, INJECTABLE_OPTIONS_METADATA } = require("./constants");

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

function Command(combinations) {
  return function (target, methodName) {
    if (!target.constructor.__commandMethods) {
      target.constructor.__commandMethods = [];
    }

    target.constructor.__commandMethods.push([methodName, combinations]);
  };
}

function OnRenderer(channel) {
  return function (target, methodName) {
    ipcRenderer.on(channel, (event, ...args) => {
      const instance = Reflect.getMetadata(INJECTED_INSTANCE_METADATA, target);
      instance[methodName].call(instance, ...args);
    });
  };
}

function OnMain(channel) {
  return function (target, methodName) {
    ipcMain.on(channel, (event, ...args) => {
      const instance = Reflect.getMetadata(INJECTED_INSTANCE_METADATA, target);
      instance[methodName].call(instance, ...args);
    });
  };
}

module.exports.Injectable = Injectable;
module.exports.Expose = Expose;
module.exports.Command = Command;
module.exports.OnRenderer = OnRenderer;
module.exports.OnMain = OnMain;
