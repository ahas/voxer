import { BrowserWindow } from "electron";
import type { EventEmitter } from "events";

export class VoxerEventEmitter extends EventEmitter {}

export interface Voxer {
  invoke<T = any>(win: BrowserWindow, eventName: string, ...args: any[]): T;
}

export const voxer: Voxer;
