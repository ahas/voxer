import { dialog } from "electron";
import { voxer, Injectable, MenuItem } from "#app";
import { Sub } from "./sub";
import fs from "fs";

@Injectable({
  inject: [Sub],
})
export class App {
  currentFile: string | undefined = undefined;

  constructor(private readonly sub: Sub) {}

  @MenuItem("New")
  async newFile() {
    this.currentFile = undefined;
    await voxer.invoke("set-content", "");
  }

  @MenuItem("Open")
  async openFile() {
    const fileName = dialog.showOpenDialogSync(voxer.win)?.[0];

    if (fileName) {
      this.currentFile = fileName;
      const content = fs.readFileSync(fileName).toString("utf-8");
      await voxer.invoke("set-content", content);
    }
  }

  @MenuItem("Save")
  async save() {
    const content = await voxer.receive<string>("content");
    this.currentFile ??= dialog.showSaveDialogSync(voxer.win);

    if (this.currentFile) {
      fs.writeFileSync(this.currentFile, content);
    }
  }

  @MenuItem("Save as")
  async saveAs() {
    const content = await voxer.invoke<string>("menu:save");
    const fileName = dialog.showSaveDialogSync(voxer.win);

    if (fileName) {
      fs.writeFileSync(fileName, content);
    }
  }

  @MenuItem("Print")
  print() {
    voxer.win.webContents.print();
  }
}
