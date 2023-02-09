import { setupBrowser } from "@testing-library/webdriverio";
import { expectMessage, reset } from "./utils";

describe("application loading", () => {
  before(() => {
    setupBrowser(browser);
  });

  describe("types", () => {
    it("will be kept type from Date to Date", async () => {
      const printButton = await browser.$("#print-object-type");

      await reset();
      await printButton.click();
      await expectMessage("true");
    });

    it("will be converted from Buffer to Uint8Array", async () => {
      const printButton = await browser.$("#print-buffer-type");

      await reset();
      await printButton.click();
      await expectMessage("true");
    });

    it("will be kept type from Date to Date", async () => {
      const printButton = await browser.$("#print-date-type");

      await reset();
      await printButton.click();
      await expectMessage("true");
    });

    it("will be translated from Vec2 class to xy interface", async () => {
      const printButton = await browser.$("#print-vec2-type");

      await reset();
      await printButton.click();
      await expectMessage("true");
    });
  });
});
