import { UserConfig as ViteConfig } from "vite";
import { resolve } from "path";
import { BrowserWindowConstructorOptions } from "electron";
import { Configuration as BuildOptions } from "electron-builder";

const cwd = process.cwd();

export interface UserConfig {
    main?: string;
    window: BrowserWindowConstructorOptions;
    vite?: ViteConfig;
    build?: BuildOptions;
}

export function defineConfig(config: UserConfig) {
    return config;
}

export function readConfig() {
    const config = require(resolve(cwd, ".voxer/dist/voxer.config.js"));
    return config.default || config;
}
