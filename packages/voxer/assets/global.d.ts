import { EventEmitter } from "events";

declare global {
    interface VoxerApp {
        injectables: Function[];
        renderer: EventEmitter;
        main: EventEmitter;
    }

    var voxer: VoxerApp;
}

export {};