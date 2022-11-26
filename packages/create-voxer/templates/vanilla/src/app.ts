import { voxer, Expose, Command, Injectable, Accessor, MenuItem } from "#app";
import { dialog } from "electron";
import { Sub } from "./sub";

@Injectable({
  inject: [Sub],
})
export class App {
  @Accessor({ as: "value" })
  private _value: number = 0;

  get value() {
    return this._value++;
  }
  set value(val) {
    this._value = val;
    voxer.invoke("message", "Reset");
    voxer.invoke("count", val);
  }

  constructor(private readonly sub: Sub) {}

  @Expose()
  async maximize() {
    voxer.win.maximize();
    await voxer.invoke("message", "Maximized");
  }

  @Expose()
  unmaximize() {
    voxer.win.unmaximize();
    voxer.invoke("message", "Unmaximized");
  }

  @Expose()
  showMenu() {
    voxer.win.setMenuBarVisibility(true);
    voxer.invoke("message", "Menu bar visible");
  }

  @Expose()
  hideMenu() {
    voxer.win.setMenuBarVisibility(false);
    voxer.invoke("message", "Menu bar hidden");
  }

  @Command("ctrl+c")
  copy() {
    voxer.invoke("message", "Ctrl + c pressed");
  }

  @Command("ctrl+v")
  paste() {
    voxer.invoke("message", "Ctrl + v pressed");
  }

  @MenuItem("Open")
  openFile() {
    const fileName = dialog.showOpenDialogSync(voxer.win);

    voxer.invoke("message", fileName);
  }
}
