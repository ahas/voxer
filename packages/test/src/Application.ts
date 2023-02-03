import { MainWindow, voxer, Expose, Command, Injectable, Accessor, MenuItem } from "#voxer";
import { Dependency } from "./Dependency";

@Injectable({
  inject: [Dependency],
  as: "app",
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
      title: "VOXER (test)",
      width: 800,
      height: 600,
    });
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

  @Expose()
  showMenu() {
    this.handle.setMenuBarVisibility(true);
    voxer.invoke("message", "Menu bar visible");
  }

  @Expose()
  hideMenu() {
    this.handle.setMenuBarVisibility(false);
    voxer.invoke("message", "Menu bar hidden");
  }

  @Command("ctrl+c")
  async copy() {
    await voxer.invoke("message", "Ctrl + c pressed");
  }

  @Command("ctrl+v")
  async paste() {
    await voxer.invoke("message", "Ctrl + v pressed");
  }

  @MenuItem("MenuItem_Label")
  async MenuItem_Label() {
    console.log("label");
    await voxer.invoke("message", "MenuItem_Label");
  }

  @MenuItem("#MenuItem_Id")
  async MenuItem_Id() {
    await voxer.invoke("message", "MenuItem_Id");
  }

  @MenuItem(":CommandOrControl+O")
  async MenuItem_Accel() {
    await voxer.invoke("message", "MenuItem_Accel");
  }

  @MenuItem("$about")
  async MenuItem_Role() {
    await voxer.invoke("message", "MenuItem_Role");
  }

  @Expose()
  async callDepAsync() {
    await this.dep.getAsyncMessage();
  }

  @Expose()
  callDepSync() {
    this.dep.getSyncMessage();
  }

  @Expose()
  createBuffer(): Buffer {
    return Buffer.allocUnsafe(1000);
  }
}
