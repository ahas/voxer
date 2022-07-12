import { BrowserWindow } from "electron";
import { Expose, Injectable } from "#app/decorators";
import { Sub } from "./sub";

@Injectable({
    inject: [Sub],
})
export class App {
    constructor(private readonly sub: Sub) {}

    @Expose()
    maximize() {
        const win = BrowserWindow.getAllWindows()[0];
        win.maximize();
        this.sub.sub();
    }

    @Expose()
    unmaximize() {
        const win = BrowserWindow.getAllWindows()[0];
        win.unmaximize();
    }

    @Expose()
    showMenu() {
        const win = BrowserWindow.getAllWindows()[0];
        win.setMenuBarVisibility(true);
    }

    @Expose()
    hideMenu() {
        const win = BrowserWindow.getAllWindows()[0];
        win.setMenuBarVisibility(false);
    }
}
