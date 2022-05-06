declare global {
    interface CustomEventMap {}
    interface Api {}
    interface Voxer {
        title: string;
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

export {}