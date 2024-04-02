import { ipcMain } from "electron";
import { inject } from "#voxer";
import { Application } from "./Application";

export async function launch() {
  process.env.TEST === "true" && (await import("./main/wdio/main"));
}

export async function main() {
  const win = inject(Application);

  win.setApplicationMenu([
    {
      role: "fileMenu",
      submenu: [
        { label: "MenuItem_Label" },
        { label: "MenuItem_Id", id: "MenuItem_Id" },
        { label: "MenuItem_Accel", accelerator: "CommandOrControl+O" },
        { label: "MenuItem_Role", role: "about" },
      ],
    },
    { role: "viewMenu" },
  ]);

  (() => {
    const appMenu = win.getApplicationMenu();
    const menuItems = appMenu?.items[0].submenu?.items;

    ipcMain.handle("wdio-electron", (_, [funcName]) => {
      switch (funcName) {
        case "MenuItem_Label":
          menuItems?.[0]?.click();
          break;
        case "MenuItem_Id":
          menuItems?.[1]?.click();
          break;
        case "MenuItem_Accel":
          menuItems?.[2]?.click();
          break;
        case "MenuItem_Role":
          menuItems?.[3]?.click();
          break;
        case "test":
          return "test";
      }
    });
  })();
}
