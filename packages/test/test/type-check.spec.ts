import { setupBrowser } from "@testing-library/webdriverio";
import { expectMessage, reset } from "./utils";

describe("application loading", () => {
  before(() => {
    setupBrowser(browser);
  });

  describe("types", () => {
    it("will be converted from Buffer to Uint8Array", async () => {
      const printBufferTypeButton = await browser.$("#print-buffer-type");

      await reset();
      await printBufferTypeButton.click();
      await expectMessage("true");
    });

    it("will be kept type from Date to Date", async () => {
      const printBufferTypeButton = await browser.$("#print-date-type");

      await reset();
      await printBufferTypeButton.click();
      await expectMessage("true");
    });
  });
});
