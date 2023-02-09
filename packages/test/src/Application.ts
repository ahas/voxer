import { MainWindow, voxer, Expose, Command, Injectable, Accessor, MenuItem } from "#voxer";
import { Dependency } from "./Dependency";
import { BrowserWindow } from "electron";

class Vec2 {
  constructor(public x: number, public y: number) {}
}

class A {}
class B {}
class C<T = H> {}
class D {}
class E {}
class F {}
class G {}
class H {}
class I {}

type AA = A | B;
type AB<T = I> = C<G> & D;

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
  callFunction(fn: Function) {
    fn();
  }

  @Expose()
  create(type: any) {
    return new type();
  }

  @Expose()
  createObject(): Object {
    return Object.create(null);
  }

  @Expose()
  createBuffer(): Buffer {
    return Buffer.allocUnsafe(1000);
  }

  @Expose()
  createDate(): Date {
    return new Date();
  }

  @Expose()
  createVec2(): Vec2 {
    return new Vec2(10, 20);
  }

  @Expose()
  getBrowser(): BrowserWindow {
    return null as any;
  }

  @Expose()
  testAlias_1<T = E & F>() {}

  @Expose()
  testAlias_2<T = E | F>() {}

  @Expose()
  testAlias_3<T = AA>() {}

  @Expose()
  testAlias_4<T = AB>() {}
}
