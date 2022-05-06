"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const config = require("./voxer.config.json");
window.addEventListener("DOMContentLoaded", () => { });
electron_1.contextBridge.exposeInMainWorld("voxer", {
    title: (_a = config.window) === null || _a === void 0 ? void 0 : _a.title,
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlbG9hZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9wcm9kL3ByZWxvYWQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsdUNBQXlDO0FBRXpDLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO0FBRTlDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxrQkFBa0IsRUFBRSxHQUFHLEVBQUUsR0FBRSxDQUFDLENBQUMsQ0FBQztBQUV0RCx3QkFBYSxDQUFDLGlCQUFpQixDQUFDLE9BQU8sRUFBRTtJQUNyQyxLQUFLLEVBQUUsTUFBQSxNQUFNLENBQUMsTUFBTSwwQ0FBRSxLQUFLO0NBQzlCLENBQUMsQ0FBQyJ9