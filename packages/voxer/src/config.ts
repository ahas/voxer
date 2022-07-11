import { resolve } from "path";
import { exists } from "./utils";
import type { UserConfig as ViteConfig } from "vite";
import type { Configuration as BuildOptions } from "electron-builder";

const cwd = process.cwd();

export function readConfig() {
    const configPathForTs = resolve(cwd, ".voxer/dist/voxer.config.js");
    if (exists(configPathForTs)) {
        const config = require(configPathForTs);
        return config.default || config;
    }

    const config = require(resolve(cwd, "./voxer.config.js"));
    return config.default || config;
}

export interface UserConfig {
    main?: string;
    vite?: ViteConfig;
    build?: BuildOptions;
}
