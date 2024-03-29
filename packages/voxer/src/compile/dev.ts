import * as chokidar from "chokidar";
import * as fs from "node:fs";
import * as child_process from "child_process";
import { exec, ChildProcess } from "child_process";
import { createServer, ViteDevServer } from "vite";
import { mkdir } from "./utils";
import { UserConfig } from "./config";
import { BuildOptions, installVoxer } from "./build";
import { printChunkSync, printInfo } from "cornsol";

const cwd = process.cwd();
const watchers: chokidar.FSWatcher[] = [];

export function pipeIo(child: ChildProcess): void {
  const print = async (type: "info" | "error", chunk: any) => {
    printChunkSync(console[type], chunk);
  };

  child.stderr?.on("data", print.bind(null, "error"));
  child.stdout?.on("data", print.bind(null, "info"));
}

export function runElectron(args: string[]): ChildProcess {
  mkdir(".voxer");

  const command = `npx cross-env NODE_ENV=development electron ${args.join(" ")} .`;
  const electron = exec(command);

  pipeIo(electron);

  return electron;
}

export async function runVite(config: UserConfig): Promise<ViteDevServer> {
  const server = await createServer({
    configFile: false,
    root: cwd + "/view",
    ...(config.vite || {}),
  });

  await server.listen();
  server.printUrls();

  return server;
}

export async function runChildProcesses(commands: string[]) {
  for (const command of commands) {
    console.info("Execute child process: %s", command);
    const args = command.split(" ");
    const child = child_process.spawn(args[0], args.slice(1), { cwd: process.cwd() });
    pipeIo(child);
  }
}

export async function runDevApp(options: BuildOptions, electronArgs: string[]): Promise<void> {
  const config = await installVoxer(options);

  console.info('Installed')

  const viteServer = await runVite(config);
  const electron = runElectron(electronArgs);

  const restartVite = async () => {
    printInfo("Restart vite dev server");
    await viteServer?.restart();
  };

  const closeElectron = async () => {
    printInfo("Close electron process");

    if (viteServer.httpServer?.listening) {
      await viteServer?.close();
    }

    await unwatchAll();
    electron.kill();
  };

  const restartElectron = async () => {
    printInfo("Restart electron process");
    electron.once("close", () => {
      runDevApp(options, electronArgs);
    });
    await closeElectron();
  };

  electron.on("exit", () => {
    closeElectron();
  });

  watch("src", restartElectron);
  watch("voxer.config.ts", restartElectron);
  watch("package.json", restartElectron);
  watch("tsconfig.json", restartElectron);
}

export function watch(path: string, callback: (...args: any[]) => void): fs.FSWatcher | null {
  path = cwd + "/" + path;

  if (fs.existsSync(path)) {
    const watcher = chokidar.watch(path);
    watcher.on("change", callback);
    watchers.push(watcher);

    return watcher;
  }

  return null;
}

export async function unwatchAll() {
  for (const watcher of watchers) {
    await watcher?.close();
  }

  watchers.length = 0;
}
