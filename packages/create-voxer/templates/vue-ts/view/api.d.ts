import type { App } from "#imports/app";

declare global {
    interface Window {
        App: App;
    }

    var App: App;
}

export {};
