import TsconfigPathsPlugin from "tsconfig-paths-webpack-plugin";
import { isPreloadDefined } from "./utils";
import { resolve as resolvePath } from "path";

const cwd = process.cwd();

function preprocessorLoader() {
  return {
    loader: "webpack-preprocessor-loader",
    options: {
      params: {
        IS_PRELOAD_DEFINED: isPreloadDefined(),
      },
    },
  };
}

function tsLoader(tsConfigPath: string) {
  return {
    loader: "ts-loader",
    options: {
      configFile: tsConfigPath,
      allowTsInNodeModules: true,
    },
  };
}

export function getWebpackConfig() {
  const entry = resolvePath(__dirname, "../../src/runtime/preload.ts");
  const tsConfigPath = resolvePath(cwd, ".voxer", "tsconfig.preload.json");
  const outputPath = resolvePath(cwd, ".voxer/runtime");

  return {
    entry,
    externals: {
      electron: "commonjs electron",
    },
    module: {
      rules: [
        {
          test: /\.[jt]sx?$/,
          use: [preprocessorLoader(), tsLoader(tsConfigPath)],
        },
      ],
    },
    resolve: {
      plugins: [new TsconfigPathsPlugin({ configFile: tsConfigPath })],
      extensions: [".tsx", ".ts", ".js"],
    },
    devtool: "inline-source-map",
    output: {
      filename: "preload.js",
      path: outputPath,
    },
  };
}
