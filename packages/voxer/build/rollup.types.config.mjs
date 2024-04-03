import alias from "@rollup/plugin-alias";
import * as glob from "glob";
import mm from "micromatch";
import dts from "rollup-plugin-dts";
import { fileURLToPath } from "url";

function createTypesConfig(input, output, renderChunk, filter) {
  input = ".types-temp/" + input;

  let files = glob.sync(input);

  if (filter) {
    files = filter(files);
  }

  return files.map((file) => {
    const outputFile = output.replace("*", mm.capture(input, file)[0]);

    return {
      input: file,
      output: [{ file: outputFile, format: "es", sourcemap: false }],
      plugins: [
        dts(),
        alias({
          entries: [
            {
              find: /^@\/(.*)/,
              replacement: fileURLToPath(new URL("../.types-temp/$1", import.meta.url)),
            },
          ],
        }),
      ],
    };
  });
}

export default [
  createTypesConfig("runtime/index.d.ts", "dist/runtime/index.d.mts"),
  createTypesConfig("compile/config.d.ts", "dist/compile/config.d.mts"),
].flat();
