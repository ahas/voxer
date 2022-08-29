import { BrowserWindow } from "electron";
import { Expose, Command, Injectable } from "#app";
import { Sub } from "./sub";

@Injectable({
  inject: [Sub],
})
export class App {
  win: BrowserWindow;

  constructor(private readonly sub: Sub) {
    this.win = BrowserWindow.getAllWindows()[0];
  }

  @Expose()
  maximize() {
    this.win.maximize();
    this.sub.sub();
  }

  @Expose()
  unmaximize() {
    this.win.unmaximize();
  }

  @Expose()
  showMenu() {
    this.win.setMenuBarVisibility(true);
  }

  @Expose()
  hideMenu() {
    this.win.setMenuBarVisibility(false);
  }

  @Command("ctrl+c")
  copy() {
    console.log("copy");
  }
}
