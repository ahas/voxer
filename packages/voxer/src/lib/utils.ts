import fs from "fs";
import { relative, dirname, join, resolve, basename } from "path";
import glob from "glob";
import ts, { MapLike } from "typescript";
import { printDel } from "cornsol";

const cwd = process.cwd();

export function cleanVoxer(): void {
  printDel("Delete voxer runtime");
  fs.rmSync(resolve(cwd, ".voxer"), { force: true, recursive: true });
}

export function cleanRelease(): void {
  printDel("Delete voxer release folder");
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

export function resolveAlias(): void {
  const configFile = ts.findConfigFile(resolve(cwd, "src"), ts.sys.fileExists, "tsconfig.json");

  if (!configFile) {
    throw Error("tsconfig.json not found");
  }

  const { config } = ts.readConfigFile(configFile, ts.sys.readFile);
  const { options } = ts.parseJsonConfigFileContent(config, ts.sys, resolve(cwd, "src"));

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

export function formatDuration(duration: number) {
  if (duration > 1000 * 60) {
    const minutes = Math.floor(duration / 1000 / 60);
    const seconds = Math.ceil((duration - minutes * 60 * 1000) / 1000);

    return seconds === 0 ? `${minutes}m` : `${minutes}m ${seconds}s`;
  } else {
    const seconds = Math.floor(duration / 1000);
    const milliseconds = duration - seconds * 1000;

    return milliseconds === 0 ? `${seconds}s` : `${seconds}s ${milliseconds}ms`;
  }
}

export function isPreloadDefined() {
  return glob.sync(resolve(cwd, "src/preload.{js,ts,jsx,tsx}")).length > 0;
}
