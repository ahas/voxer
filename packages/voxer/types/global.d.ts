import type { EventEmitter } from "node:events";
import type { ipcRenderer } from "electron";

declare global {
    interface CustomEventMap {}
    interface Api {}
    interface Voxer {
        title: string;
        injectables: Function[];
        events: {
            on: InstanceType<typeof EventEmitter>["on"];
            once: InstanceType<typeof EventEmitter>["once"];
            off: InstanceType<typeof EventEmitter>["off"];
            send: typeof ipcRenderer["send"];
            sendSync: typeof ipcRenderer["sendSync"];
            invoke: typeof ipcRenderer["invoke"];
            handle: (eventName: string | symbol, listener: (...args: any[]) => any) => this;
        };
    }

    interface Window {
        api: Api;
        voxer: Voxer;
        addEventListener<K extends keyof CustomEventMap>(
            tyse: K,
            listener: (this: Document, ev: CustomEventMap[K]) => void,
        ): void;
        removeEventListener<K extends keyof CustomEventMap>(
            type: K,
            listener: (this: Document, ev: CustomEventMap[K]) => void,
        ): void;
    }

    var api: Api;
    var voxer: Voxer;
}

export {};
