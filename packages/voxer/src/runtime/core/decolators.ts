import * as electron from "electron";
import "reflect-metadata";
import {
  INJECTABLE_ACCESSORS_METADATA,
  INJECTABLE_COMMANDS_METADATA,
  INJECTABLE_DEPENDENCIES_METADATA,
  INJECTABLE_EXPOSED_METHODS_METADATA,
  INJECTABLE_INSTANCE_METADATA,
  INJECTABLE_INVOKE_HOOK_METADATA,
  INJECTABLE_MARK,
  INJECTABLE_MENU_ITEMS_METADATA,
  INJECTABLE_OPTIONS_METADATA,
} from "./constants";
import type {
  AccessorMethod,
  AccessorOptions,
  CommandHandler,
  ExposeOptions,
  ExposedMethod,
  InjectableOptions,
  InvokeHook,
  MenuItemHandler,
} from "./types";
import { isAsyncFunction } from "./utils";
import { voxer } from "./voxer.main";

const { ipcMain, ipcRenderer } = electron;

function getMetadata<T>(key: string, target: any, defaultValue: T): T {
  if (!Reflect.hasMetadata(key, target)) {
    Reflect.defineMetadata(key, defaultValue, target);
  }

  return Reflect.getMetadata(key, target);
}

// Class Decorator
export function Injectable(options?: InjectableOptions) {
  return function (target: Function) {
    Reflect.defineMetadata(INJECTABLE_MARK, true, target);
    Reflect.defineMetadata(INJECTABLE_OPTIONS_METADATA, options, target);
    Reflect.defineMetadata(INJECTABLE_DEPENDENCIES_METADATA, options?.inject || [], target);
    voxer.inject(target as any);
  };
}

// Method Decorator
export function Expose(options?: ExposeOptions) {
  options = options || {};

  return function <T extends Function>(target: T, context: ClassMethodDecoratorContext) {
    const exposedMethods = getMetadata<ExposedMethod<T>[]>(INJECTABLE_EXPOSED_METHODS_METADATA, target.constructor, []);
    const isAsync = isAsyncFunction(target);

    exposedMethods.push({
      context,
      isAsync,
      options,
    });
  };
}

// Method Decorator
export function Invoke(channel: string) {
  return function <T extends Function>(target: T, context: ClassMethodDecoratorContext) {
    const invokeHooks = getMetadata<InvokeHook<T>[]>(INJECTABLE_INVOKE_HOOK_METADATA, target.constructor, []);
    const hook = {
      context,
      channel,
      rendererChannel: `$voxer:renderer:${channel}`,
    };

    invokeHooks.push(hook);

    return function (this: any, ...args: any[]) {
      if (isAsyncFunction(target)) {
        target.apply(this, args).then((ret: any) => {
          voxer.win.handle.webContents.send(hook.rendererChannel, ret);
        });
      } else {
        const ret = target.apply(this, args);
        voxer.win.handle.webContents.send(hook.rendererChannel, ret);
      }
    };
  };
}

// Property Decorator
export function Accessor(options?: AccessorOptions) {
  return function <T extends Object>(target: T, context: any) {
    const accessors = getMetadata<AccessorMethod<T>[]>(INJECTABLE_ACCESSORS_METADATA, target.constructor, []);

    accessors.push({ context, options });
  };
}

// Method Decorator
export function Command(combinations: string | string[]) {
  return function <T extends Function>(target: T, context: ClassMethodDecoratorContext) {
    const commands = getMetadata<CommandHandler<T>[]>(INJECTABLE_COMMANDS_METADATA, target.constructor, []);
    const isAsync = isAsyncFunction(target);

    commands.push({
      context,
      isAsync,
      combinations,
    });
  };
}

// Method Decorator
export function MenuItem(selector: string | string[]) {
  return function <T extends Function>(target: T, context: ClassMethodDecoratorContext) {
    const menuItems = getMetadata<MenuItemHandler<T>[]>(INJECTABLE_MENU_ITEMS_METADATA, target.constructor, []);
    const isAsync = isAsyncFunction(target);

    menuItems.push({
      context,
      isAsync,
      selector,
    });
  };
}

// Method Decorator
export function OnRenderer(channel: string) {
  return function <T extends Function>(target: T) {
    ipcRenderer.on(channel, (event, ...args) => {
      target(...args);
    });
  };
}

// Method Decorator
export function OnMain(channel: string) {
  return function <T extends Function>(target: T) {
    ipcMain.on(channel, (event, ...args) => {
      target(...args);
    });
  };
}
