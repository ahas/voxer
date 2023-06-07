import * as fs from "fs";
import * as prettier from "prettier";
import { resolve } from "path";
import { TypeTranslator } from "./type-translator";

const cwd = process.cwd();

export function translate(): void {
  const outputFileName = resolve(cwd, ".voxer/api.d.ts");

  if (fs.existsSync(outputFileName)) {
    fs.unlinkSync(outputFileName);
  }

  const translator = new TypeTranslator(cwd);
  const source = translator.execute();

  fs.writeFileSync(outputFileName, prettier.format(source, { parser: "typescript" }));
}
