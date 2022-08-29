import { BrowserWindow } from "electron";
import { App } from "./app";
export declare function main(win: BrowserWindow): Promise<void>;
export declare function preload(): void;
export declare function inject(): typeof App[];
