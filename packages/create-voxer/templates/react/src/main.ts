import { inject } from "#voxer";
import { Application } from "./Application";

export async function main() {
  const app = inject(Application);

  app.setApplicationMenu([
    { role: "fileMenu", submenu: [{ label: "Open", accelerator: "CommandOrControl+O" }] },
    { role: "viewMenu" },
  ]);
}
