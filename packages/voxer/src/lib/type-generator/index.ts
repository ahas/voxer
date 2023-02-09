import { resolve } from "path";
import fs from "fs";
import { Translator } from "./translator";
import prettier from "prettier";

const cwd = process.cwd();

export function translate(): void {
  const outputFileName = resolve(cwd, ".voxer/api.d.ts");

  if (fs.existsSync(outputFileName)) {
    fs.unlinkSync(outputFileName);
  }

  const translator = new Translator(cwd);
  const source = translator.execute();

  fs.writeFileSync(outputFileName, prettier.format(source, { parser: "typescript" }));
}