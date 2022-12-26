import { voxer, Expose, Command, Injectable, Accessor, MenuItem, MainWindow } from "#voxer";
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
    super({
      title: "VOXER (react)",
      width: 800,
      height: 600,
    });
  }

  @Expose()
  async maximize() {
    voxer.win.handle.maximize();
    await voxer.invoke("message", "Maximized");
  }

  @Expose()
  unmaximize() {
    voxer.win.handle.unmaximize();
    voxer.invoke("message", "Unmaximized");
  }

  @Expose()
  showMenu() {
    voxer.win.handle.setMenuBarVisibility(true);
    voxer.invoke("message", "Menu bar visible");
  }

  @Expose()
  hideMenu() {
    voxer.win.handle.setMenuBarVisibility(false);
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
    const fileName = dialog.showOpenDialogSync(voxer.win.handle);

    voxer.invoke("message", fileName);
  }

  @Expose()
  callDependency() {
    this.dep.foo();
  }
}
