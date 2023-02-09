import { TypeTranslator } from "./type-translator";
import fs from "fs";
import { dirname, resolve } from "path";
import prettier from "prettier";

const cwd = resolve(__dirname, "../../../../test");
const outputFileName = resolve(cwd, ".voxer/api.d.ts");

fs.mkdirSync(dirname(cwd), { recursive: true });

if (fs.existsSync(outputFileName)) {
  fs.unlinkSync(outputFileName);
}

const translator = new TypeTranslator(cwd);


console.log(outputFileName);
fs.writeFileSync(outputFileName, prettier.format(translator.execute(), { parser: "typescript" }));
