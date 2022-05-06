import { exec, ChildProcess } from "child_process";
import { createServer, ViteDevServer } from "vite";
import { UserConfig } from "./config";
import { mkdir, copySource } from "./utils";

const cwd = process.cwd();

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

export function runElectron(): ChildProcess {
    mkdir(".voxer");
    copySource("dev/main.js", ".voxer");
    copySource("dev/preload.js", ".voxer");

    const electron = exec(`npx electron .`);
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
