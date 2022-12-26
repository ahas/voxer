import { MainWindow, voxer, Expose, Command, Injectable, Accessor, MenuItem } from "#voxer";
import { dialog } from "electron";
import { Dependency } from "./Dependency";

@Injectable({
  as: "app",
  inject: [Dependency],
})
export class Application extends MainWindow {
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

  constructor(private readonly dep: Dependency) {
    super();
  }

  @Expose()
  async maximize() {
    this.handle.maximize();
    await voxer.invoke("message", "Maximized");
  }

  @Expose()
  unmaximize() {
    this.handle.unmaximize();
    voxer.invoke("message", "Unmaximized");
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
    const fileName = dialog.showOpenDialogSync(this.handle);

    voxer.invoke("message", fileName);
  }

  @Expose()
  async callDependency() {
    await this.dep.foo();
  }
}
