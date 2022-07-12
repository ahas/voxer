#!/usr/bin/env node
import { Command, Option } from "commander";
import { electronFlags } from "./electron-flags";
import { buildElectron, buildRelease, buildTs, buildVite } from "./build";
// import { clean } from "./utils";

import { readConfig } from "./config";
import * as dev from "./dev";
import { cleanRelease, cleanVoxer, isTs } from "./utils";

const pkg = require("../package.json");

const program = new Command();
// prettier-ignore
program.name("voxer")
    .description(pkg.description)
    .version(pkg.version);

withElectronFlags(program.command("start"))
    .description("[default] Run application in a development")
    .action(async (options, command) => {
        const optionDefs: Option[] = command.options;
        const electronOptions = [];

        for (const optionDef of optionDefs) {
            const { long, required, negate } = optionDef;
            const attr = optionDef.attributeName();
            const val = options[attr];

            if (
                (negate && !val) ||
                (!required && !negate && val && typeof val === "boolean") ||
                (required && val && typeof val !== "boolean")
            ) {
                let exp = long;
                if (required) {
                    exp += "=" + val;
                }

                electronOptions.push({
                    attr,
                    required,
                    long,
                    negate,
                    val,
                    type: typeof val,
                    exp,
                });
            }
        }

        const electronArgs = electronOptions.map((x) => x.exp || "");
        cleanVoxer();
        await dev.runApp(electronArgs);
    });

program
    .command("build")
    .description("Build")
    .option("-s, --src", "build src")
    .option("-v, --vite", "build vite")
    .option("-e, --electron", "build electron")
    .action(async (options, command) => {
        cleanVoxer();

        if (Object.keys(options).length === 0) {
            await buildRelease();
        } else {
            if (isTs()) {
                await buildTs();
            }

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
    .action(async (options) => {
        cleanVoxer();
        cleanRelease();
        await buildRelease();
    });

program.parse();

function withElectronFlags(command: Command) {
    electronFlags.forEach((flags) => {
        command.option(flags.join(" "));
    });
    return command;
}
