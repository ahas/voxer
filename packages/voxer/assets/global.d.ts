import type { EventEmitter } from "node:events";

declare global {
    interface VoxerApp {
        injectables: Function[];
        events: {
            on: InstanceType<typeof EventEmitter>["on"];
            once: InstanceType<typeof EventEmitter>["once"];
            off: InstanceType<typeof EventEmitter>["off"];
        };
    }

    var voxer: VoxerApp;
}

export {};
