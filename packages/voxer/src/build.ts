import ts from "typescript";
import { resolve } from "path";
import { readConfig, UserConfig } from "./config";
import { build as _buildVite } from "vite";
import { build as _buildElectron } from "electron-builder";
import { isTs, mkdir, resolveAlias } from "./utils";
import { duplicateAsset, compileTemplate } from "./assets";

const cwd = process.cwd();

interface InstallVoxerOptions {
  isTs?: boolean;
  isDev?: boolean;
  config?: UserConfig;
}

export async function buildTs() {
  mkdir(".voxer");
  installTypes();

  const configFile = ts.findConfigFile(resolve(cwd, "src"), ts.sys.fileExists, "tsconfig.json");
  if (!configFile) {
    throw Error("tsconfig.json not found");
  }
  const { config } = ts.readConfigFile(configFile, ts.sys.readFile);
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

  resolveAlias(options);
}

export async function buildVite(config: UserConfig) {
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

export async function buildElectron(config: UserConfig) {
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

export async function buildRelease() {
  if (isTs()) {
    await buildTs();
  }

  const config = readConfig();
  installAssets({ isDev: false, config });
  await buildVite(config);
  await buildElectron(config);
}

export async function installTypes() {
  duplicateAsset("lib/params.d.ts");
  duplicateAsset("lib/decorators.d.ts");
  duplicateAsset("lib/metadata-storage.d.ts");
  duplicateAsset("lib/events.d.ts");
  duplicateAsset("index.d.ts");
  duplicateAsset("voxer.d.ts");
  duplicateAsset("tsconfig.json");
}

export function installAssets(options: InstallVoxerOptions) {
  options = options || {};
  options.isTs = isTs();

  compileTemplate("templates/main.js", options);
  compileTemplate("templates/load.js", options);
  compileTemplate("templates/resolve.js", options);
  duplicateAsset("lib/constants.js");
  duplicateAsset("lib/decorators.js");
  duplicateAsset("lib/inject.js");
  duplicateAsset("lib/metadata-storage.js");
  duplicateAsset("lib/params.js");
  duplicateAsset("lib/events.js");
  duplicateAsset("main.js");
  duplicateAsset("preload.js");
  duplicateAsset("index.js");
}
