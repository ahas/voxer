#!/usr/bin/env node
import * as cornsol from "cornsol";
import { Command, Option } from "commander";
import { electronFlags } from "./electron-flags";
import { buildRelease, installVoxer } from "./build";

import { pipeIo, runChildProcesses, runDevApp } from "./dev";
import { cleanRelease, cleanVoxer, isVoxerPackage } from "./utils";

cornsol.register();

const pkg = require("../../package.json");

const program = new Command();
// prettier-ignore
program.name("voxer")
    .description(pkg.description)
    .version(pkg.version);

function getElectronArgs(options: any, optionDefs: Option[]) {
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

  return electronOptions.map((x) => x.exp || "");
}

withElectronFlags(program.command("start"))
  .option("--with <commands...>")
  .description("[default] Run application in a development")
  .action(async (options, command) => {
    if (!isVoxerPackage()) {
      console.error("Cannot find voxer configuration !");
      process.exit();
    }

    await runChildProcesses(options.with);
    await runDevApp(
      {
        mode: "development",
        targets: { vite: true, electron: true },
      },
      getElectronArgs(
        options,
        (command.options as Option[]).filter((x) => {
          const attrName = x.attributeName();
          return attrName !== "with";
        })
      )
    );
  });

program
  .command("prepare")
  .description("Prepare voxer resources")
  .option("-d, --dev")
  .option("--no-src", "Run typescript build")
  .action(async (options) => {
    await installVoxer({
      mode: options.dev ? "development" : "production",
    });
  });

program
  .command("build")
  .description("Build")
  .option("--no-src", "Run typescript build")
  .option("--no-vite", "Run vite build")
  .option("--no-electron", "Run electron build")
  .action(async (options) => {
    await buildRelease({
      mode: "production",
      targets: {
        vite: options.vite,
        electron: options.electron,
      },
    });
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
  .option("--no-src", "Run typescript build")
  .option("--no-vite", "Run vite build")
  .option("--no-electron", "Run electron build")
  .option("-m, --mac")
  .option("-w, --win")
  .option("-l, --linux")
  .option("--portable")
  .option("--ia32")
  .option("--x64")
  .action(async (options) => {
    cleanRelease();
    await buildRelease(options);
  });

program.parse();

function withElectronFlags(command: Command) {
  electronFlags.forEach((flags) => {
    command.option(flags.join(" "));
  });
  return command;
}
