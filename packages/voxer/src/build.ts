import ts from "typescript";
import { resolve } from "path";
import { readConfig, UserConfig } from "./config";
import { build as _buildVite } from "vite";
import { build as _buildElectron } from "electron-builder";
import { isTs, mkdir } from "./utils";
import { writeTemplate } from "./template";

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

    const options = {
        isTs: isTs(),
        isDev: false,
        config,
    };
    writeTemplate("main.js", options);
    writeTemplate("preload.js", options);

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
        await buildSrc();
    }

    const config = readConfig();

    await buildVite(config);
    await buildElectron(config);
}
