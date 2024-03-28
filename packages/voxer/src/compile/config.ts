import fs from "node:fs";
import { resolve } from "node:path";
import { exists } from "./utils";

import type { Configuration as BuildOptions } from "electron-builder";
import type { UserConfig as ViteConfig } from "vite";

const cwd = process.cwd();

export interface UserConfig {
  main?: string;
  vite?: ViteConfig;
  build?: BuildOptions;
}

export async function readConfig(): Promise<UserConfig> {
  const configPathForTs = resolve(cwd, ".voxer/dist/voxer.config.js");

  if (exists(configPathForTs)) {
    const config = await import(configPathForTs);
    return config.default || config;
  }

  const config = await import(resolve(cwd, "./voxer.config.js"));
  return config.default || config;
}
