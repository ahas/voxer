import fs from "node:fs";

const packageJson = JSON.parse(
  fs.readFileSync("./package.json", { encoding: "utf-8" })
) as Partial<{
  name: string;
  version: string;
}>;
const { name, version } = packageJson;

describe("application loading", () => {
  describe("App", () => {
    it("should launch the application", async () => {
      const appName = await browser.electron.app("getName");
      const appVersion = await browser.electron.app("getVersion");

      expect(appName).toEqual(name);
      expect(appVersion).toEqual(version);
    });
  });
});
