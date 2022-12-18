import { setupBrowser } from "@testing-library/webdriverio";
import { getBounds, waitFor } from "./utils";

describe("application loading", () => {
  before(() => {
    setupBrowser(browser);
  });

  describe("click events", () => {
    describe("when the button counter is clicked", () => {
      it("increases the number", async () => {
        const counterButton = await browser.$("button#counter");
        const resetButton = await browser.$("button#reset");

        await counterButton.click();
        expect(await counterButton.getText()).toEqual("0");
        await counterButton.click();
        expect(await counterButton.getText()).toEqual("1");
        await resetButton.click();
        expect(await counterButton.getText()).toEqual("0");
      });
    });
  });

  describe("exposed methods", () => {
    describe("when resize buttons is clicked", () => {
      it("resizes window", async () => {
        const bounds = await getBounds();
        const messageP = await browser.$("p#message");
        const maximizeButton = await browser.$("button#maximize");
        const unmaximizeButton = await browser.$("button#unmaximize");
        await maximizeButton.click();
        await waitFor(100);

        const biggerBounds = await getBounds();

        expect(await messageP.getText()).toEqual("Maximized");
        expect(biggerBounds.width).toBeGreaterThan(bounds.width);
        expect(biggerBounds.height).toBeGreaterThan(bounds.height);

        await unmaximizeButton.click();
        await waitFor(100);

        const lastBounds = await getBounds();

        expect(await messageP.getText()).toEqual("Unmaximized");
        expect(lastBounds.width).toEqual(bounds.width);
        expect(lastBounds.height).toEqual(bounds.height);
      });
    });

    describe("when menu interacted", () => {
      it("changes application menu visibility", async () => {
        const showMenuButton = await browser.$("button#show_menu");
        const hideMenuButton = await browser.$("button#hide_menu");

        await showMenuButton.click();
        expect(await browser.electronBrowserWindow("isMenuBarVisible")).toEqual(true);

        await hideMenuButton.click();
        expect(await browser.electronBrowserWindow("isMenuBarVisible")).toEqual(false);

        await showMenuButton.click();
        expect(await browser.electronBrowserWindow("isMenuBarVisible")).toEqual(true);
      });

      it("triggers application menu click events", async () => {
        const messageP = await browser.$("p#message");
        const apis = ["MenuItem_Label", "MenuItem_Id", "MenuItem_Accel", "MenuItem_Role"];

        for (const api of apis) {
          await browser.electronAPI(api);
          await waitFor(100);
          expect(await messageP.getText()).toEqual(api);
        }
      });
    });
  });

  describe("keyboard events", () => {
    describe("when command pressed", () => {
      it("sends ctrl + c and ctrl + v command", async () => {
        const messageP = await browser.$("p#message");

        await browser.keys(["WDIO_CONTROL", "c"]);
        expect(await messageP.getText()).toEqual("Ctrl + c pressed");
        await browser.keys(["WDIO_CONTROL", "v"]);
        expect(await messageP.getText()).toEqual("Ctrl + v pressed");
      });
    });
  });

  describe("dependency", () => {
    describe("when dependency method call button is pressed", () => {
      it("call dependency method", async () => {
        const messageP = await browser.$("p#message");
        const callDepButton = await browser.$("button#call-dep");
        const callDepDirectlyButton = await browser.$("button#call-dep-directly");

        await callDepButton.click();
        expect(await messageP.getText()).toEqual("Message from Dependency");

        await callDepDirectlyButton.click();
        expect(await messageP.getText()).toEqual("Message from Dependency");
      });
    })
  });
});
