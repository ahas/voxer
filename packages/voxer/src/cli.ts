#!/usr/bin/env node
import { Command } from "commander";
import { buildAssets, buildElectron, buildRelease, buildSrc, buildVite } from "./build";
// import { clean } from "./utils";

import { readConfig } from "./config";
import * as dev from "./start";
import { cleanRelease, cleanVoxer } from "./utils";

const pkg = require("../package.json");

const program = new Command();
// prettier-ignore
program.name("voxer")
    .description(pkg.description)
    .version(pkg.version);

async function start() {
    cleanVoxer();
    await buildSrc();

    const config = readConfig();
    const server = await dev.runVite(config);
    const electron = dev.runElectron();

    electron.on("close", () => {
        server.close();
    });
}

program.action(() => start());
program
    .command("start")
    .description("[default] Run application in a development")
    .action(() => start());

program
    .command("build")
    .description("Build")
    .option("-s, --src", "build src")
    .option("-v, --vite", "build vite")
    .option("-e, --electron", "build electron")
    .action(async (options) => {
        cleanVoxer();

        if (Object.keys(options).length === 0) {
            await buildRelease();
        } else {
            if (options.src) {
                await buildSrc();
            }
            await buildAssets();
            const config = readConfig();

            if (options.vite) {
                await buildVite(config);
            }

            if (options.electron) {
                await buildElectron(config);
            }
        }
    });

program
    .command("clean")
    .description("Remove output files")
    .action(() => {
        cleanVoxer();
    });

program
    .command("rebuild")
    .description("Rebuild")
    .action(async () => {
        cleanVoxer();
        cleanRelease();
        await buildRelease();
    });

program.parse(process.argv);
