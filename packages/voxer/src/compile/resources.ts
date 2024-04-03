import * as fs from "node:fs";
import { resolve, relative } from "node:path";
import { printLog } from "cornsol";

const cwd = process.cwd();

export function duplicateResource(from: "res" | "dist", name: string, as?: string) {
  const resDir = resolve(cwd, ".voxer");

  fs.mkdirSync(resDir, { recursive: true });
  const src = resolve(import.meta.dirname, "../../", from, name);
  const dst = resolve(resDir, as || name);
  printLog(`Duplicate ${relative(cwd, src)} to ${relative(cwd, dst)}`);
  fs.cpSync(src, dst, { recursive: true });
}
