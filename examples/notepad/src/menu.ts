import { Menu } from "electron";

export function buildAppMenu() {
  return Menu.buildFromTemplate([
    {
      label: "File",
      role: "fileMenu",
      submenu: [
        { label: "New", accelerator: "CommandOrControl+N" },
        { type: "separator" },
        { label: "Open", accelerator: "CommandOrControl+O" },
        { label: "Save", accelerator: "CommandOrControl+S" },
        { label: "Save as", accelerator: "CommandOrControl+Shift+S" },
        { type: "separator" },
        { label: "Print", accelerator: "CommandOrControl+P" },
        { type: "separator" },
        { role: "quit" },
      ],
    },
    {
      label: "Edit",
      role: "editMenu",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "delete" },
        { type: "separator" },
        { role: "selectAll" },
      ],
    },
    {
      role: "viewMenu",
    },
  ]);
}
