import "reflect-metadata";
import { ipcRenderer, ipcMain } from "electron";
import {
  INJECTABLE_MARK,
  INJECTABLE_INSTANCE_METADATA,
  INJECTABLE_OPTIONS_METADATA,
  INJECTABLE_DEPENDENCIES_METADATA,
  INJECTABLE_ACCESSORS_METADATA,
  INJECTABLE_COMMANDS_METADATA,
  INJECTABLE_MENU_ITEMS_METADATA,
  INJECTABLE_EXPOSED_METHODS_METADATA,
  INJECTABLE_INVOKE_HOOK_METADATA,
} from "./constants";
import { isAsyncFunction } from "./utils";
import { inject } from "./inject";
import { voxer } from "./voxer.main";

export interface InjectableOptions {
  inject?: Function[];
  as?: string;
}

export interface AccessorOptions {
  getter?: string;
  setter?: string;
  as?: string;
}

export interface ExposeOptions {
  as?: string;
}

export interface MethodMetadata<T> {
  methodName: keyof T;
  isAsync: boolean;
}

export interface ExposedMethod<T> extends MethodMetadata<T> {
  options?: ExposeOptions;
}

export interface InvokeHook<T> {
  methodName: keyof T;
  channel: string;
  rendererChannel: string;
}

export interface AccessorMethod<T> {
  propertyKey: keyof T;
  options?: AccessorOptions;
}

export interface CommandHandler<T> extends MethodMetadata<T> {
  combinations: string | string[];
}

export interface MenuItemHandler<T> extends MethodMetadata<T> {
  selector: string | string[];
}

function getMetadata<T>(key: string, target: any, defaultValue: T): T {
  if (!Reflect.hasMetadata(key, target)) {
    Reflect.defineMetadata(key, defaultValue, target);
  }

  return Reflect.getMetadata(key, target);
}

export function Injectable(options?: InjectableOptions): ClassDecorator {
  return function (target: Function) {
    Reflect.defineMetadata(INJECTABLE_MARK, true, target);
    Reflect.defineMetadata(INJECTABLE_OPTIONS_METADATA, options, target);
    Reflect.defineMetadata(INJECTABLE_DEPENDENCIES_METADATA, options?.inject || [], target);
    inject(target as any);
  };
}

export function Expose(options?: ExposeOptions): MethodDecorator {
  options = options || {};

  return function <T extends Object>(target: T, propertyKey: string | symbol) {
    const exposedMethods = getMetadata<ExposedMethod<T>[]>(INJECTABLE_EXPOSED_METHODS_METADATA, target.constructor, []);
    const methodName = propertyKey as keyof T;
    const isAsync = isAsyncFunction(target[methodName]);

    exposedMethods.push({
      methodName,
      isAsync,
      options,
    });
  };
}

export function Invoke(channel: string): MethodDecorator {
  return function <T extends Object>(target: T, propertyKey: string | symbol, descriptor: any) {
    const invokeHooks = getMetadata<InvokeHook<T>[]>(INJECTABLE_INVOKE_HOOK_METADATA, target.constructor, []);
    const methodName = propertyKey as keyof T;
    const hook = {
      methodName,
      channel,
      rendererChannel: `$voxer:renderer:${channel}`,
    };

    invokeHooks.push(hook);

    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      if (isAsyncFunction(originalMethod)) {
        originalMethod.apply(target, args).then((ret: any) => {
          voxer.win.handle.webContents.send(hook.rendererChannel, ret);
        });
      } else {
        const ret = originalMethod.apply(target, args);

        voxer.win.handle.webContents.send(hook.rendererChannel, ret);
      }
    };
  };
}

export function Accessor(options?: AccessorOptions): PropertyDecorator {
  return function <T extends Object>(target: T, propertyKey: string | symbol) {
    const accessors = getMetadata<AccessorMethod<T>[]>(INJECTABLE_ACCESSORS_METADATA, target.constructor, []);

    accessors.push({ propertyKey: propertyKey as keyof T, options });
  };
}

export function Command(combinations: string | string[]): MethodDecorator {
  return function <T extends Object>(target: T, propertyKey: string | symbol) {
    const commands = getMetadata<CommandHandler<T>[]>(INJECTABLE_COMMANDS_METADATA, target.constructor, []);
    const methodName = propertyKey as keyof T;
    const isAsync = isAsyncFunction(target[methodName]);

    commands.push({
      methodName,
      isAsync,
      combinations,
    });
  };
}

export function MenuItem(selector: string | string[]): MethodDecorator {
  return function <T extends Object>(target: T, propertyKey: string | symbol) {
    const menuItems = getMetadata<MenuItemHandler<T>[]>(INJECTABLE_MENU_ITEMS_METADATA, target.constructor, []);
    const methodName = propertyKey as keyof T;
    const isAsync = isAsyncFunction(target[methodName]);

    menuItems.push({
      methodName,
      isAsync,
      selector,
    });
  };
}

export function OnRenderer(channel: string): MethodDecorator {
  return function (target: Object, methodName: string | symbol) {
    ipcRenderer.on(channel, (event, ...args) => {
      const instance = Reflect.getMetadata(INJECTABLE_INSTANCE_METADATA, target.constructor);
      instance[methodName].call(instance, ...args);
    });
  };
}

export function OnMain(channel: string): MethodDecorator {
  return function (target: Object, methodName: string | symbol) {
    ipcMain.on(channel, (event, ...args) => {
      const instance = Reflect.getMetadata(INJECTABLE_INSTANCE_METADATA, target.constructor);
      instance[methodName].call(instance, ...args);
    });
  };
}
