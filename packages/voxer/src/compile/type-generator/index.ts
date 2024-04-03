import * as fs from "node:fs";
import * as prettier from "prettier";
import { resolve } from "node:path";
import { TypeTranslator } from "./type-translator";

const cwd = process.cwd();

export async function translate(): Promise<void> {
  const outputFileName = resolve(cwd, ".voxer/api.d.ts");

  if (fs.existsSync(outputFileName)) {
    fs.unlinkSync(outputFileName);
  }

  const translator = new TypeTranslator(cwd);
  const source = translator.execute();

  fs.writeFileSync(outputFileName, await prettier.format(source, { parser: "typescript" }));
}
