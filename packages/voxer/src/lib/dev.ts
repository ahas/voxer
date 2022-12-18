import { exec, ChildProcess } from "child_process";
import { createServer, ViteDevServer } from "vite";
import chokidar from "chokidar";
import fs from "fs";
import { mkdir } from "./utils";
import { UserConfig } from "./config";
import { installVoxer } from "./build";
import { consoleInfo } from "./console";

const cwd = process.cwd();
const watchers: chokidar.FSWatcher[] = [];

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

export async function runDevApp(electronArgs: string[]): Promise<void> {
  const config = await installVoxer();
  const viteServer = await runVite(config);
  const electron = runElectron(electronArgs);

  const restartVite = async () => {
    consoleInfo("Restart vite dev server");
    await viteServer?.restart();
  };

  const closeElectron = async () => {
    consoleInfo("Close electron process");

    if (viteServer.httpServer?.listening) {
      await viteServer?.close();
    }

    await unwatchAll();
    electron.kill();
  };

  const restartElectron = async () => {
    consoleInfo("Restart electron process");
    electron.once("close", () => {
      runDevApp(electronArgs);
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
