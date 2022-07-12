import { BrowserWindow } from "electron";
import { App } from "./app";

export async function main(win: BrowserWindow) {
    console.log("user main");
    win.setTitle("Voxer + Vue (TS)");
    win.setSize(800, 600);
}

export function preload() {}

export function inject() {
    return [App];
}
