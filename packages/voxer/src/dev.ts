import { exec, ChildProcess } from "child_process";
import { createServer, ViteDevServer } from "vite";
import { isTs, mkdir } from "./utils";
import fs from "fs";
import { readConfig, UserConfig } from "./config";
import { buildTs, installAssets } from "./build";

const cwd = process.cwd();
const watchers: fs.FSWatcher[] = [];

let printLine = 0;

export function pipeIo(child: ChildProcess): void {
  const print = (type: "info" | "error", chunk: any) => {
    const messages = Buffer.from(chunk).toString().trim().split("\n");
    for (const msg of messages) {
      console[type]("➤ Electron [%s] %s", String(printLine).padStart(4, "0"), msg);
    }
    if (++printLine >= 10000) {
      printLine = 0;
    }
  };
  child.stderr?.on("data", print.bind(null, "error"));
  child.stdout?.on("data", print.bind(null, "info"));
}

export function runElectron(args: string[]): ChildProcess {
  mkdir(".voxer");

  const command = `npx electron ${args.join(" ")} .`;
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

export async function runApp(electronArgs: string[]): Promise<void> {
  if (isTs()) {
    await buildTs();
  }

  const config = readConfig();
  installAssets({ isDev: true, config });

  const viteServer = await runVite(config);
  const electron = runElectron(electronArgs);

  const restartVite = async () => {
    viteServer?.restart();
  };

  const closeElectron = async () => {
    await viteServer?.close();
    unwatchAll();

    electron.removeAllListeners();
    electron.kill();
  };

  electron.on("close", closeElectron);

  const restartElectron = async () => {
    await closeElectron();
    await runApp(electronArgs);
  };

  watch("src", restartElectron);
  watch("voxer.config.js", restartElectron);
  watch("voxer.config.ts", restartElectron);
  watch("package.json", restartElectron);
  watch("tsconfig.json", restartElectron);
  watch("view", restartVite);
}

export function watch(path: string, callback: () => void | Promise<void>): fs.FSWatcher | null {
  path = cwd + "/" + path;
  if (fs.existsSync(path)) {
    const watcher = fs.watch(path, { recursive: true, persistent: true }, callback);
    watchers.push(watcher);

    return watcher;
  }

  return null;
}

export function unwatchAll() {
  for (const watcher of watchers) {
    watcher?.close();
  }
}
