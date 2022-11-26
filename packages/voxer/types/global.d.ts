import type { EventEmitter } from "node:events";

declare global {
  class Voxer {
    title: string;
    injectables: Function[];
    on: InstanceType<typeof EventEmitter>["on"];
    once: InstanceType<typeof EventEmitter>["once"];
    off: InstanceType<typeof EventEmitter>["off"];
    send(channel: string, ...args: any[]): void;
    sendSync<T = void>(channel: string, ...args: any[]): T;
    invoke<T = void>(channel: string, ...args: any[]): Promise<T>;
    handle(eventName: string | symbol, listener: (...args: any[]) => any): this;
    serve(name: string | symbol, listener: (...args: any[]) => any): this;
    receive<T>(name: string | symbol, ...args: any[]): T;
  }

  interface CustomEventMap {}

  interface Window {
    voxer: Voxer;
    addEventListener<K extends keyof CustomEventMap>(
      tyse: K,
      listener: (this: Document, ev: CustomEventMap[K]) => void
    ): void;
    removeEventListener<K extends keyof CustomEventMap>(
      type: K,
      listener: (this: Document, ev: CustomEventMap[K]) => void
    ): void;
  }

  var voxer: Voxer;
}

export {};
