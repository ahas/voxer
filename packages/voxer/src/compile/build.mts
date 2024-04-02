import { printLog, printStep } from "cornsol";
import { build as _buildElectron } from "electron-builder";
import fs from "node:fs";
import { resolve as resolvePath } from "node:path";
import { rollup } from "rollup";
import ts from "typescript";
import { build as _buildVite } from "vite";
import { readConfig, type UserConfig } from "./config.mjs";
import { duplicateResource } from "./resources.mjs";
import { translate } from "./type-generator/mod.mjs";
import { cleanVoxer, mkdir, resolveAliases } from "./utils.mjs";

// Rollup Plugins
import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript2 from "rollup-plugin-typescript2";

const cwd = process.cwd();

export interface BuildOptions {
  mode: "development" | "production";
  targets?: { [key in "vite" | "electron"]?: boolean };
}

export function buildPreload(options: BuildOptions): Promise<void> {
  return printStep("Build preload", async () => {
    printLog("Bundling...");

    const bundle = await rollup({
      input: resolvePath(cwd, ".voxer/runtime/preload.mjs"),
      external: ["electron"],
      plugins: [
        nodeResolve({ preferBuiltins: false }),
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

export function buildMain(options: BuildOptions): Promise<void> {
  return printStep("Build main", async () => {
    printLog("Bundling...");

    const bundle = await rollup({
      input: resolvePath(cwd, "src/main.ts"),
      external: ["electron"],
      plugins: [
        nodeResolve({ preferBuiltins: false }),
        commonjs(),
        typescript2({
          tsconfig: resolvePath(cwd, ".voxer/tsconfig.main.json"),
        }),
      ],
    });

    await bundle.write({
      dir: resolvePath(cwd, ".voxer/dist"),
      format: "cjs",
      inlineDynamicImports: true,
    });
    await bundle.close();
  });
}

export function buildConfig(): Promise<{ options: ts.CompilerOptions }> {
  return printStep("Build main", async () => {
    const configFile = ts.findConfigFile(resolvePath(cwd, ".voxer"), ts.sys.fileExists, "tsconfig.main.json");

    printLog("Compiling...");

    const { config } = ts.readConfigFile(configFile!, ts.sys.readFile);
    const { options } = ts.parseJsonConfigFileContent(config, ts.sys, resolvePath(cwd, "src"));

    fs.writeFileSync(
      resolvePath(cwd, ".voxer/voxer.config.js"),
      ts.transpile(fs.readFileSync(resolvePath(cwd, "voxer.config.ts"), "utf-8"), options)
    );

    return { options };
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
          main: ".voxer/runtime/main.js",
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
    await installVoxer(options);
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
    duplicateResource("res", "tsconfig.json");
    duplicateResource("res", "tsconfig.main.json");
    duplicateResource("res", "tsconfig.preload.json");
    duplicateResource("dist", "runtime");
  });
}

export async function installVoxer(options: BuildOptions): Promise<void> {
  cleanVoxer();

  await installRuntime();
  await buildConfig();
  await buildMain(options);
  await buildPreload(options);

  console.log("Resolving aliases");
  resolveAliases();

  console.log("Translating...");
  await translate();
}
