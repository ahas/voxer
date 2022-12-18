import ejs from "ejs";
import { resolve, dirname, basename } from "path";
import fs from "fs";
import prettier from "prettier";

const cwd = process.cwd();

export async function compileTemplate(name: string, options: any) {
  const text = fs.readFileSync(resolve(__dirname, "../res", name + ".ejs")).toString();
  const template = ejs.compile(text);
  const output = removeScriptTag(
    await template({
      ...options,
    })
  );
  const dir = dirname(name);
  const dst = resolve(cwd, ".voxer", dir);

  fs.mkdirSync(dst, { recursive: true });
  fs.writeFileSync(
    resolve(dst, basename(name)),
    prettier.format(output, {
      tabWidth: 4,
      parser: "typescript",
    })
  );
}

export function removeScriptTag(output: string) {
  return output.replace(/<\/?script>/gi, "");
}

export function duplicateResource(from: "res" | "dist", name: string) {
  const resDir = resolve(cwd, ".voxer");

  fs.mkdirSync(resDir, { recursive: true });
  const src = resolve(__dirname, "../../", from, name);
  const dst = resolve(resDir, name);
  fs.cpSync(src, dst, { recursive: true });
}
