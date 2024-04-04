import * as babel from "@babel/core";
import { printLog, printStep } from "cornsol";
import { build as _buildElectron } from "electron-builder";
import * as glob from "glob";
import * as fs from "node:fs/promises";
import { basename, dirname, join, relative, resolve as resolvePath } from "node:path";
import { rollup } from "rollup";
import { build as _buildVite } from "vite";
import { readConfig, type UserConfig } from "./config";
import { duplicateResource } from "./resources";
import { translate } from "./type-generator";
import { cleanVoxer, mkdir, resolveAliases } from "./utils";

// Rollup Plugins
import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript2 from "rollup-plugin-typescript2";

const cwd = process.cwd();

export interface BuildOptions {
  mode: "development" | "production";
  targets?: { [key in "vite" | "electron"]?: boolean };
}

export interface TranspileOptions {
  input: string;
  outDir?: string;
  baseDir?: string;
}

export function bundlePreload(): Promise<void> {
  return printStep("Build preload", async () => {
    printLog("Bundling...");

    const bundle = await rollup({
      input: resolvePath(cwd, ".voxer/runtime/preload.mjs"),
      external: ["electron"],
      plugins: [
        nodeResolve(),
        commonjs(),
        typescript2({
          tsconfig: resolvePath(cwd, ".voxer/tsconfig.preload.json"),
        }),
      ],
    });

    await bundle.write({
      file: resolvePath(cwd, ".voxer/preload.js"),
      format: "cjs",
      inlineDynamicImports: true,
    });
    await bundle.close();
  });
}

export function transpile(step: string, options: TranspileOptions) {
  return printStep(`Build ${step}`, () => {
    printLog("Transpiling...");

    const baseDir = options.baseDir ?? "";
    const outDir = options.outDir ?? "";
    const filenames = glob.sync(resolvePath(cwd, join(baseDir, options.input)));

    return Promise.all(
      filenames.map(async (x) => {
        const result = await babel.transformFileAsync(x, {
          presets: [
            [import.meta.resolve("@babel/preset-env"), { modules: false }],
            import.meta.resolve("@babel/preset-typescript"),
          ],
          plugins: [
            [import.meta.resolve("@babel/plugin-proposal-decorators"), { version: "legacy" }],
            [import.meta.resolve("babel-plugin-add-import-extension"), { extension: "mjs" }],
            [
              import.meta.resolve("babel-plugin-module-resolver"),
              {
                root: [resolvePath(cwd, ".voxer")],
                alias: {
                  "#voxer": "./runtime/index.mjs",
                },
              },
            ],
          ],
        });

        if (result?.code) {
          const out = join(".voxer", outDir, dirname(relative(baseDir, x)), basename(x, ".ts") + ".mjs");
          await fs.mkdir(dirname(out), { recursive: true });
          await fs.writeFile(out, result.code);
        }
      })
    );
  });
}

export function buildVite(config: UserConfig) {
  return printStep("Build vite", () => {
    mkdir(".voxer");

    return _buildVite({
      configFile: false,
      root: cwd + "/view",
      base: "./",
      build: {
        outDir: resolvePath(cwd, ".voxer"),
      },
      logLevel: "silent",
      ...config.vite,
    });
  });
}

export function buildElectron(config: UserConfig): Promise<string[]> {
  return printStep("Build electron", () => {
    mkdir(".voxer");

    return _buildElectron({
      config: {
        extraMetadata: {
          main: ".voxer/runtime/main.mjs",
        },
        files: [".voxer/**/*"],
        directories: {
          output: resolvePath(cwd, ".release"),
        },
        ...config.build,
      },
    });
  });
}

export function buildRelease(options: BuildOptions): Promise<void> {
  return printStep("Build for release", async () => {
    await installVoxer();
    const config = await readConfig();

    if (options.targets?.vite) {
      await buildVite(config);
    }

    if (options.targets?.electron) {
      await buildElectron(config);
    }
  });
}

export function installRuntime(): Promise<void> {
  return printStep("Install voxer runtime", () => {
    duplicateResource("res", "tsconfig.base.json");
    duplicateResource("res", "tsconfig.main.json");
    duplicateResource("res", "tsconfig.preload.json");
    duplicateResource("res", "tsconfig.view.json");
    duplicateResource("dist", "runtime");
  });
}

export async function installVoxer(): Promise<void> {
  cleanVoxer();

  await installRuntime();
  await transpile("config", { input: "voxer.config.ts" });
  await transpile("main", {
    input: "**/*.ts",
    baseDir: "src",
    outDir: "dist",
  });
  await bundlePreload();

  console.log("Translating...");
  await translate();
}
