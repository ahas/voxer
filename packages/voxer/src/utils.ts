import fs from "fs";
import { resolve, basename } from "path";

const cwd = process.cwd();

export function cleanVoxer() {
    console.info("clean .voxer");
    fs.rmSync(resolve(cwd, ".voxer"), { force: true, recursive: true });
}

export function cleanRelease() {
    console.info("clean voxer_release");
    fs.rmSync(resolve(cwd, "voxer_release"), { force: true, recursive: true });
}

export function mkdir(...paths: string[]): void {
    fs.mkdirSync(resolve(cwd, ...paths), { recursive: true });
}

export function copySource(filename: string, dst: string): void {
    fs.copyFileSync(resolve(__dirname, filename), resolve(cwd, dst, basename(filename)));
}
