"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = require("path");
function createWindow() {
    const config = require("./voxer.config.json");
    const { main } = require("./dist/main.js");
    const win = new electron_1.BrowserWindow(Object.assign(Object.assign({}, config.window), { webPreferences: {
            preload: __dirname + "/preload.js",
            nodeIntegration: false,
            contextIsolation: true,
        } }));
    win.loadFile((0, path_1.resolve)(__dirname, "index.html"));
    main(win);
}
electron_1.app.whenReady().then(() => {
    createWindow();
    electron_1.app.on("activate", () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
electron_1.app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        electron_1.app.quit();
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9wcm9kL21haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSx1Q0FBOEM7QUFDOUMsK0JBQStCO0FBRS9CLFNBQVMsWUFBWTtJQUNqQixNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMscUJBQXFCLENBQUMsQ0FBQztJQUM5QyxNQUFNLEVBQUUsSUFBSSxFQUFFLEdBQUcsT0FBTyxDQUFDLGdCQUFnQixDQUFDLENBQUM7SUFDM0MsTUFBTSxHQUFHLEdBQUcsSUFBSSx3QkFBYSxpQ0FDdEIsTUFBTSxDQUFDLE1BQU0sS0FDaEIsY0FBYyxFQUFFO1lBQ1osT0FBTyxFQUFFLFNBQVMsR0FBRyxhQUFhO1lBQ2xDLGVBQWUsRUFBRSxLQUFLO1lBQ3RCLGdCQUFnQixFQUFFLElBQUk7U0FDekIsSUFDSCxDQUFDO0lBRUgsR0FBRyxDQUFDLFFBQVEsQ0FBQyxJQUFBLGNBQU8sRUFBQyxTQUFTLEVBQUUsWUFBWSxDQUFDLENBQUMsQ0FBQztJQUUvQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDZCxDQUFDO0FBRUQsY0FBRyxDQUFDLFNBQVMsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7SUFDdEIsWUFBWSxFQUFFLENBQUM7SUFDZixjQUFHLENBQUMsRUFBRSxDQUFDLFVBQVUsRUFBRSxHQUFHLEVBQUU7UUFDcEIsSUFBSSx3QkFBYSxDQUFDLGFBQWEsRUFBRSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7WUFDNUMsWUFBWSxFQUFFLENBQUM7U0FDbEI7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNQLENBQUMsQ0FBQyxDQUFDO0FBRUgsY0FBRyxDQUFDLEVBQUUsQ0FBQyxtQkFBbUIsRUFBRSxHQUFHLEVBQUU7SUFDN0IsSUFBSSxPQUFPLENBQUMsUUFBUSxLQUFLLFFBQVEsRUFBRTtRQUMvQixjQUFHLENBQUMsSUFBSSxFQUFFLENBQUM7S0FDZDtBQUNMLENBQUMsQ0FBQyxDQUFDIn0=