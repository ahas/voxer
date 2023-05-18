const { join } = require("path");
const packageJSON = require("./package.json");

const voxerConfig = require("./.voxer/dist/voxer.config").default;
const {
  build: { productName },
} = voxerConfig;

process.env.TEST = true;

const config = {
  services: [
    [
      "electron",
      {
        appPath: join(__dirname, "voxer_release"),
        appName: productName,
        appArgs: [],
        chromedriver: {
          port: 9519,
          logFileName: "wdio-chromedriver.log",
        },
        electronVersion: packageJSON.devDependencies.electron,
      },
    ],
  ],
  capabilities: [{}],
  port: 9519,
  waitforTimeout: 5000,
  connectionRetryCount: 10,
  connectionRetryTimeout: 30000,
  logLevel: "info",
  runner: "local",
  outputDir: "wdio-logs",
  specs: ["./test/*.spec.ts"],
  autoCompileOpts: {
    autoCompile: true,
    tsNodeOpts: {
      transpileOnly: true,
      files: true,
      project: join(__dirname, "tsconfig.json"),
    },
  },
  framework: "mocha",
  mochaOpts: {
    ui: "bdd",
    timeout: 30000,
  },
};

module.exports = { config };
