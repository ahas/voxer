import { BrowserWindow } from "electron";

export interface Main {
    main(win: BrowserWindow): void;
    preload(): void;
    inject(): object[];
}