import ts from "typescript";
import { resolve } from "path";
import { readConfig, type UserConfig } from "./config";
import { build as _buildVite } from "vite";
import { build as _buildElectron } from "electron-builder";
import { cleanVoxer, mkdir, resolveAlias } from "./utils";
import { duplicateResource } from "./resources";
import { consoleStart } from "./console";
import { transform } from "./transform";
import type { RollupOutput, RollupWatcher } from "rollup";

// webpack features
import webpack from "webpack";
import { TsconfigPathsPlugin } from "tsconfig-paths-webpack-plugin";

const cwd = process.cwd();

export function buildPreload(): Promise<webpack.Stats> {
  const entry = resolve(__dirname, "../../src/runtime/preload.ts");
  const configFile = resolve(cwd, ".voxer/tsconfig.preload.json");
  const outputPath = resolve(cwd, ".voxer/runtime");

  const compiler = webpack({
    entry,
    mode: "development",
    externals: {
      electron: "commonjs electron",
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: [
            {
              loader: "ts-loader",
              options: {
                configFile,
              },
            },
          ],
          exclude: /node_modules|.yarn/,
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
    compiler.run((err, stats) => {
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
}

export async function buildApp(): Promise<{ options: ts.CompilerOptions }> {
  let configFile = ts.findConfigFile(resolve(cwd, "src"), ts.sys.fileExists, "tsconfig.json");

  if (!configFile) {
    configFile = ts.findConfigFile(resolve(cwd, ".voxer"), ts.sys.fileExists, "tsconfig.main.json");
  }

  const { config } = ts.readConfigFile(configFile!, ts.sys.readFile);
  const { options, fileNames, errors } = ts.parseJsonConfigFileContent(config, ts.sys, resolve(cwd, "src"));
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
}

export async function buildVite(config: UserConfig): Promise<RollupOutput | RollupOutput[] | RollupWatcher> {
  mkdir(".voxer");

  return await _buildVite({
    configFile: false,
    root: cwd + "/view",
    base: "./",
    build: {
      outDir: resolve(cwd, ".voxer"),
    },
    ...config.vite,
  });
}

export async function buildElectron(config: UserConfig): Promise<string[]> {
  mkdir(".voxer");

  return await _buildElectron({
    config: {
      files: [".voxer/**/*"],
      directories: {
        output: resolve(cwd, "voxer_release"),
      },
      ...config.build,
    },
  });
}

export async function buildRelease(options: any): Promise<void> {
  const config = await installVoxer();

  if (options.vite) {
    await buildVite(config);
  }

  if (options.electron) {
    await buildElectron(config);
  }
}

export function installRuntime(): void {
  consoleStart("Installing voxer runtimes...");

  duplicateResource("res", "tsconfig.json");
  duplicateResource("res", "tsconfig.main.json");
  duplicateResource("res", "tsconfig.preload.json");
  duplicateResource("dist", "runtime");
}

export async function installVoxer(): Promise<UserConfig> {
  cleanVoxer();
  installRuntime();
  await buildApp();
  await buildPreload();
  resolveAlias();
  transform();

  return readConfig();
}
