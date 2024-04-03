import { resolve } from "node:path";

import type { Configuration as BuildOptions } from "electron-builder";
import type { UserConfig as ViteConfig } from "vite";

const cwd = process.cwd();

export interface UserConfig {
  main?: string;
  vite?: ViteConfig;
  build?: BuildOptions;
}

export function defineVoxerConfig(config: UserConfig): UserConfig {
  return config;
}

export async function readConfig(): Promise<UserConfig> {
  return await import(resolve(cwd, ".voxer/voxer.config.mjs"));
}
