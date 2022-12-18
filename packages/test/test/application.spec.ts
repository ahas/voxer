import fs from "fs";

const packageJson = JSON.parse(fs.readFileSync("./package.json", { encoding: "utf-8" })) as Partial<{
  name: string;
  version: string;
}>;
const { name, version } = packageJson;

describe("application loading", () => {
  describe("App", () => {
    it("should launch the application", async () => {
      const appName = await browser.electronApp("getName");
      const appVersion = await browser.electronApp("getVersion");

      expect(appName).toEqual(name);
      expect(appVersion).toEqual(version);
    });
  });
});
