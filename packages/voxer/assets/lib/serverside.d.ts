import { BrowserWindow } from "electron";
import type { EventEmitter } from "events";

export class VoxerEventEmitter extends EventEmitter {}

export interface Voxer {
  win: BrowserWindow;
  invoke<T = void>(eventName: string, ...args: any[]): Promise<T>;
  receive<T>(name: string, ...args: any[]): Promise<T>;
  handle(eventName: string, ...args: any[]): this;
  serve(name: string, ...args: any[]): this;
}

export const voxer: Voxer;
