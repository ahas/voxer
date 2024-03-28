import { dialog } from "electron";
import { voxer, Injectable, MenuItem, MainWindow } from "#voxer";
import fs from "node:fs";

@Injectable({
  as: "app",
})
export class Application extends MainWindow {
  currentFile: string | undefined = undefined;

  constructor() {
    super({
      title: "NotePad",
      width: 800,
      height: 600,
      frame: false,
      titleBarStyle: "hidden",
    });
  }

  @MenuItem("New")
  async newFile() {
    this.currentFile = undefined;
    await voxer.invoke("set-content", "");
  }

  @MenuItem("Open")
  async openFile() {
    const fileName = dialog.showOpenDialogSync(this.handle)?.[0];

    if (fileName) {
      this.currentFile = fileName;
      const content = fs.readFileSync(fileName).toString("utf-8");
      await voxer.invoke("set-content", content);
    }
  }

  @MenuItem("Save")
  async save() {
    const content = await voxer.receive<string>("content");
    this.currentFile ??= dialog.showSaveDialogSync(this.handle);

    if (this.currentFile) {
      fs.writeFileSync(this.currentFile, content);
    }
  }

  @MenuItem("Save as")
  async saveAs() {
    const content = await voxer.invoke<string>("menu:save");
    const fileName = dialog.showSaveDialogSync(this.handle);

    if (fileName) {
      fs.writeFileSync(fileName, content);
    }
  }

  @MenuItem("Print")
  print() {
    this.handle.webContents.print();
  }
}
