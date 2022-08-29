#!/usr/bin/env node
import inquirer from "inquirer";
import fs from "fs";
import { resolve } from "path";
import prettier from "prettier";
import { exec } from "child_process";

const cwd = process.cwd();
const root = resolve(__dirname, "..");

async function fetchVoxerVersion(): Promise<string> {
  return new Promise((resolve) => {
    const proc = exec("npm show voxer version");
    proc.stdout.on("data", (version) => {
      resolve(String(version).replace(/[\\n\n]/gi, ""));
    });
  });
}

function isValidPackageName(projectName: string): boolean {
  return /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(projectName);
}

function toValidPackageName(projectName: string): string {
  return projectName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/^[._]/, "")
    .replace(/[^a-z0-9-~]+/g, "-");
}

function print(message?: any, ...optionalParams: any[]): void {
  console.log(message, ...optionalParams);
}

function getDefaultProjectName(): string {
  let defaultName = "new-voxer-app";
  let count = 1;

  while (true) {
    const files = fs.readdirSync(cwd);
    if (files.indexOf(defaultName) >= 0) {
      defaultName = "new-voxer-app-" + count++;
    } else {
      break;
    }
  }

  return defaultName;
}

function mkdir(path: string): void {
  fs.mkdirSync(path, { recursive: true });
}

function write(dir: string, filename: string, data: string | NodeJS.ArrayBufferView): void {
  fs.writeFileSync(resolve(dir, filename), data);
}

async function copyTemplate(target: "vue", projectName: string): Promise<void> {
  const projectDir = resolve(cwd, projectName);

  fs.cpSync(resolve(root, "templates/" + target), projectDir, {
    force: true,
    recursive: true,
  });

  const pkg = require(resolve(projectDir, "package.json"));
  pkg.name = projectName;
  pkg.devDependencies["voxer"] = "^" + (await fetchVoxerVersion());
  write(
    projectDir,
    "package.json",
    prettier.format(JSON.stringify(pkg, null, 4), {
      parser: "json",
      printWidth: 120,
      tabWidth: 4,
      useTabs: false,
    })
  );
}

function pkgFromUserAgent(userAgent: string | undefined) {
  if (!userAgent) {
    return undefined;
  }
  const pkgSpec = userAgent.split(" ")[0];
  const pkgSpecArr = pkgSpec.split("/");
  return {
    name: pkgSpecArr[0],
    version: pkgSpecArr[1],
  };
}

(async (projectName: string) => {
  if (!projectName) {
    const { projectName: name } = await inquirer.prompt({
      name: "projectName",
      type: "input",
      message: "Project name",
      default: getDefaultProjectName(),
    });
    projectName = name;
  }

  if (!isValidPackageName(projectName)) {
    projectName = toValidPackageName(projectName);
  }

  const { framework } = await inquirer.prompt({
    name: "framework",
    type: "list",
    message: "Select a framework",
    choices: ["vanilla", "vue", "react", "preact", "lit", "svelte"],
  });

  print("Scaffolding project in %s...", resolve(cwd, projectName));
  await copyTemplate(framework, projectName);

  const pkgInfo = pkgFromUserAgent(process.env.npm_config_user_agent);
  const pkgManager = pkgInfo ? pkgInfo.name : "npm";
  print("Done. Now run:");

  print(`  cd ${projectName}`);
  switch (pkgManager) {
    case "yarn":
      print("  yarn");
      print("  yarn dev");
      break;
    default:
      print(`  ${pkgManager} install`);
      print(`  ${pkgManager} run dev`);
      break;
  }
})(process.argv[2]);
