import ts from "typescript";
import { resolve } from "path";
import { UserConfig, readConfig } from "./config";
import { build as _buildVite } from "vite";
import { build as _buildElectron } from "electron-builder";
import { copySource, mkdir } from "./utils";
import fs from "fs";

const cwd = process.cwd();

export async function buildSrc() {
    mkdir(".voxer");
    const configFile = ts.findConfigFile(resolve(cwd, "src"), ts.sys.fileExists, "tsconfig.json");
    if (!configFile) {
        throw Error("tsconfig.json not found");
    }
    const { config } = ts.readConfigFile(configFile, ts.sys.readFile);
    config.compilerOptions.outDir = "../.voxer/dist";

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
}

export async function buildAssets() {
    mkdir(".voxer");
    const config = require(resolve(cwd, ".voxer/dist/voxer.config.js")).default;
    const configJson = JSON.stringify({
        window: config.window,
    });
    fs.writeFileSync(resolve(cwd, ".voxer/voxer.config.json"), configJson);
    fs.rmSync(resolve(cwd, ".voxer/dist/voxer.config.js"), { force: true });
    fs.rmSync(resolve(cwd, ".voxer/dist/voxer.config.d.ts"), { force: true });
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
    copySource("prod/main.js", ".voxer");
    copySource("prod/preload.js", ".voxer");

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
    await buildSrc();
    await buildAssets();

    const config = readConfig();
    await buildVite(config);
    await buildElectron(config);
}
