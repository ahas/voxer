import ts from "typescript";
import { resolve as resolvePath } from "path";
import { readConfig, type UserConfig } from "./config";
import { build as _buildVite } from "vite";
import { build as _buildElectron } from "electron-builder";
import { cleanVoxer, isPreloadDefined, mkdir, resolveAlias } from "./utils";
import { duplicateResource } from "./resources";
import { printLog, printStep } from "cornsol";
import { translate } from "./type-generator";
import fs from "fs";
import type { RollupOutput, RollupWatcher } from "rollup";

// webpack features
import webpack from "webpack";
import { TsconfigPathsPlugin } from "tsconfig-paths-webpack-plugin";

const cwd = process.cwd();
const EMPTY_TS_FILE = ".voxer/_voxer_empty_.ts";

export interface BuildOptions {
  mode: "development" | "production";
  targets?: { [key in "vite" | "electron"]?: boolean };
}

export function buildPreload(options: BuildOptions): Promise<webpack.Stats> {
  return printStep("Build preload", async () => {
    const entry = resolvePath(__dirname, "../../src/runtime/preload.ts");
    const configFile = resolvePath(cwd, ".voxer", "tsconfig.preload.json");
    const outputPath = resolvePath(cwd, ".voxer/runtime");

    const compiler = webpack({
      entry,
      mode: options.mode,
      externals: {
        electron: "commonjs electron",
      },
      module: {
        rules: [
          {
            test: /\.[jt]sx?$/,
            use: [
              {
                loader: "webpack-preprocessor-loader",
                options: {
                  params: {
                    IS_PRELOAD_DEFINED: isPreloadDefined(),
                  },
                },
              },
              {
                loader: "ts-loader",
                options: {
                  configFile,
                  allowTsInNodeModules: true,
                },
              },
            ],
          },
        ],
      },
      resolve: {
        plugins: [new TsconfigPathsPlugin({ configFile })],
        extensions: [".tsx", ".ts", ".js"],
      },
      output: {
        filename: "preload.js",
        path: outputPath,
      },
      devtool: "inline-source-map",
    });

    return new Promise((resolve, reject) => {
      printLog("Bundling...");
      compiler.run((err, stats) => {
        fs.rmSync(resolvePath(cwd, EMPTY_TS_FILE), { force: true });

        if (err) {
          reject(err);

          return;
        }

        const info = stats?.toJson();

        if (stats) {
          if (stats.hasErrors()) {
            info?.errors?.forEach((e) => console.error(e.stack));
          }

          resolve(stats);
        } else {
          reject();
        }
      });
    });
  });
}

export function buildMain(): Promise<{ options: ts.CompilerOptions }> {
  return printStep("Build main", async () => {
    let configFile = ts.findConfigFile(resolvePath(cwd, "src"), ts.sys.fileExists, "tsconfig.json");

    if (!configFile) {
      configFile = ts.findConfigFile(resolvePath(cwd, ".voxer"), ts.sys.fileExists, "tsconfig.main.json");
    }

    printLog("Compiling...");
    const { config } = ts.readConfigFile(configFile!, ts.sys.readFile);
    const { options, fileNames, errors } = ts.parseJsonConfigFileContent(config, ts.sys, resolvePath(cwd, "src"));
    const program = ts.createProgram({ options, rootNames: fileNames, configFileParsingDiagnostics: errors });
    const { diagnostics, emitSkipped } = program.emit();
    const allDiagnostics = ts.getPreEmitDiagnostics(program).concat(diagnostics, errors);

    if (allDiagnostics.length) {
      const formatHost: ts.FormatDiagnosticsHost = {
        getCanonicalFileName: (path) => path,
        getCurrentDirectory: ts.sys.getCurrentDirectory,
        getNewLine: () => ts.sys.newLine,
      };
      const message = ts.formatDiagnostics(allDiagnostics, formatHost);

      console.warn(message);
    }

    if (emitSkipped) {
      process.exit(1);
    }

    return { options };
  });
}

export function buildVite(config: UserConfig): Promise<RollupOutput | RollupOutput[] | RollupWatcher> {
  return printStep("Build vite", () => {
    mkdir(".voxer");

    return _buildVite({
      configFile: false,
      root: cwd + "/view",
      base: "./",
      build: {
        outDir: resolvePath(cwd, ".voxer"),
      },
      ...config.vite,
    });
  });
}

export function buildElectron(config: UserConfig): Promise<string[]> {
  return printStep("Build electron", () => {
    mkdir(".voxer");

    return _buildElectron({
      config: {
        files: [".voxer/**/*"],
        directories: {
          output: resolvePath(cwd, "voxer_release"),
        },
        ...config.build,
      },
    });
  });
}

export function buildRelease(options: BuildOptions): Promise<void> {
  return printStep("Build for release", async () => {
    const config = await installVoxer(options);

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
    duplicateResource("dist", "runtime");

    if (isPreloadDefined()) {
      duplicateResource("res", "tsconfig.preload.json");
    } else {
      duplicateResource("res", "tsconfig.preload-skip.json", "tsconfig.preload.json");
      fs.writeFileSync(resolvePath(cwd, EMPTY_TS_FILE), "");
    }
  });
}

export async function installVoxer(options: BuildOptions): Promise<UserConfig> {
  cleanVoxer();
  await installRuntime();
  await buildMain();
  await buildPreload(options);
  resolveAlias();
  translate();

  return readConfig();
}
