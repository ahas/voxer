declare global {
    interface VoxerApp {
        injectables: Function[];
    }

    var voxer: VoxerApp;
}

export {};