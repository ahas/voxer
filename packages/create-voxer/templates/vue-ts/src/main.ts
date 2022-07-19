import { BrowserWindow, Menu, ipcRenderer } from "electron";
import { App } from "./app";

export async function main(win: BrowserWindow) {
    win.setTitle("Voxer + Vue (TS)");
    win.setSize(800, 600);

    const menu = Menu.buildFromTemplate([
        {
            label: "Call",
            click: () => {
                win.webContents.send("voxer:renderer", "call", "message from main");
            },
        },
        {
            role: "viewMenu",
        },
    ]);

    win.setMenu(menu);
}

export function preload() {}

export function inject() {
    return [App];
}
