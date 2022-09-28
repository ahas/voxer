import fs from "fs";
import { relative, dirname, join, resolve, basename } from "path";
import glob from "glob";
import ts, { MapLike } from "typescript";
import { info } from "./logger";

const cwd = process.cwd();

export function cleanVoxer(): void {
  info("Remove .voxer");
  fs.rmSync(resolve(cwd, ".voxer"), { force: true, recursive: true });
}

export function cleanRelease(): void {
  info("Remove voxer_release");
  fs.rmSync(resolve(cwd, "voxer_release"), { force: true, recursive: true });
}

export function mkdir(...paths: string[]): void {
  fs.mkdirSync(resolve(cwd, ...paths), { recursive: true });
}

export function copySource(filename: string, dst: string): void {
  fs.copyFileSync(resolve(__dirname, filename), resolve(cwd, dst, basename(filename)));
}

export function exists(...paths: string[]): boolean {
  return fs.existsSync(paths.join("\\"));
}

export function isTs(): boolean {
  return exists(resolve(cwd, "voxer.config.ts"));
}

function getAliases(paths: MapLike<string[]>): Map<string, string> {
  const baseDir = resolve(cwd, ".voxer");
  const map = new Map<string, string>();

  for (const p in paths) {
    if (!p.includes("*") || paths[p].filter((x) => x.includes("*")).length === 0) {
      continue;
    }
    // const prefix = p.indexOf("/") >= 0 ? join(p.substring(0, p.indexOf("/")), "/").replace(/\\/g, "/") : p;
    const prefix = dirname(p);
    const dst = paths[p][0].substring(0, paths[p][0].lastIndexOf("/"));
    map.set(prefix, resolve(baseDir, dst));
  }

  return map;
}

function resolveAliasPrefix(paths: Map<string, string>, p: string): string {
  for (const prefix of paths.keys()) {
    if (p.startsWith(prefix)) {
      return join(paths.get(prefix) || "", p.substring(prefix.length)).replace(/\\/gi, "/");
    }
  }
  return p;
}

function getRelativeModulePath(baseDir: string, p: string): string {
  const relativePath = relative(baseDir, p);
  return (relativePath.startsWith(".") ? relativePath : `./${relativePath}`).replace(/\\/g, "/");
}

export function resolveAlias(options: ts.CompilerOptions): void {
  if (!options || !options.outDir) {
    return;
  }

  const IMPORT_REGEX = /(?:import|from)\s+['"]([^'"]*)['"]/g;
  const REQUIRE_REGEX = /(?:import|require)\s*\(\s*['"]([^'"]*)['"]\s*\)/g;
  const exts = ["js", "jsx", "ts", "tsx", "d.ts"];
  const files = glob
    .sync(`**/*.{${exts.join()}}`, { cwd: options.outDir })
    .map((x) => resolve(options.outDir || "", x));
  const aliases = getAliases(options.paths || {});

  const replace = (matched: string, pathText: string, file: string) => {
    const resolvedPath = resolveAliasPrefix(aliases, pathText);
    if (resolvedPath != pathText) {
      const index = matched.indexOf(pathText);
      const relativePath = getRelativeModulePath(dirname(file), resolvedPath);
      const replacedText = matched.substring(0, index) + relativePath + matched.substring(index + pathText.length);
      return replacedText;
    }
    return matched;
  };

  for (const file of files) {
    const oldText = fs.readFileSync(file).toString();
    const newText = oldText
      .replace(REQUIRE_REGEX, (src, matched) => replace(src, matched, file))
      .replace(IMPORT_REGEX, (src, matched) => replace(src, matched, file));
    if (oldText != newText) {
      fs.writeFileSync(file, newText);
    }
  }
}
