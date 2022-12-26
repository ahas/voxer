import { Application } from "./Application";
import { inject } from "#voxer";

export async function main() {
  const app = inject(Application);

  app.setApplicationMenu([
    { role: "fileMenu", submenu: [{ label: "Open", accelerator: "CommandOrControl+O" }] },
    { role: "viewMenu" },
  ]);
}
