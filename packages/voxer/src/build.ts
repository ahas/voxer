import ts from "typescript";
import { resolve } from "path";
import { readConfig, UserConfig } from "./config";
import { build as _buildVite } from "vite";
import { build as _buildElectron } from "electron-builder";
import { isTs, mkdir, resolveAlias } from "./utils";
import { duplicateTemplate, writeTemplate } from "./template";

const cwd = process.cwd();

export async function installTs() {
    duplicateTemplate("global.d.ts");
    duplicateTemplate("params.d.ts");
    duplicateTemplate("decorators.d.ts");
    duplicateTemplate("metadata-storage.d.ts");
    duplicateTemplate("voxer.d.ts");
    duplicateTemplate("tsconfig.json");
}

export async function buildTs() {
    mkdir(".voxer");
    installTs();

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
    installLibraries(config);
    await buildVite(config);
    await buildElectron(config);
}

export function installLibraries(config: UserConfig) {
    const options = {
        isTs: isTs(),
        isDev: true,
        config,
    };

    writeTemplate("main.js", options);
    writeTemplate("preload.js", options);
    duplicateTemplate("constants.js");
    duplicateTemplate("decorators.js");
    duplicateTemplate("inject.js");
    duplicateTemplate("metadata-storage.js");
    duplicateTemplate("params.js");
}
