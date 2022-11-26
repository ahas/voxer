const { ipcRenderer, ipcMain } = require("electron");
const { INJECTABLE_MARK, INJECTABLE_OPTIONS_METADATA } = require("./constants");
const { isAsyncFunction } = require("./utils");

function Injectable(options) {
  return function (target) {
    Reflect.defineMetadata(INJECTABLE_MARK, true, target);
    Reflect.defineMetadata(INJECTABLE_OPTIONS_METADATA, options, target);
  };
}

function Expose(options) {
  options = options || {};

  return function (target, methodName) {
    if (!target.constructor.__exposedMethods) {
      target.constructor.__exposedMethods = [];
    }

    const isAsync = isAsyncFunction(target[methodName]);

    target.constructor.__exposedMethods.push({
      methodName,
      isAsync,
      options,
    });
  };
}

function Accessor(options) {
  return function (target, propertyKey) {
    if (!target.constructor.__accessors) {
      target.constructor.__accessors = [];
    }

    target.constructor.__accessors.push({ propertyKey, options });
  };
}

function Command(combinations) {
  return function (target, methodName) {
    if (!target.constructor.__commandMethods) {
      target.constructor.__commandMethods = [];
    }

    const isAsync = isAsyncFunction(target[methodName]);

    target.constructor.__commandMethods.push({
      methodName,
      isAsync,
      combinations,
    });
  };
}

function MenuItem(selector) {
  return function (target, methodName) {
    if (!target.constructor.__menuMethods) {
      target.constructor.__menuMethods = [];
    }

    const isAsync = isAsyncFunction(target[methodName]);

    target.constructor.__menuMethods.push({
      methodName,
      isAsync,
      selector,
    });
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
module.exports.Accessor = Accessor;
module.exports.MenuItem = MenuItem;
module.exports.Command = Command;
module.exports.OnRenderer = OnRenderer;
module.exports.OnMain = OnMain;
