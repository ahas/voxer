import { setupBrowser } from "@testing-library/webdriverio";
import { reset, expectMessage, getBounds, waitFor } from "./utils";

describe("application loading", () => {
  before(() => {
    setupBrowser(browser);
  });

  describe("click events", () => {
    describe("when the button counter is clicked", () => {
      it("increases the number", async () => {
        const counterButton = await browser.$("button#counter");

        await counterButton.click();
        expect(await counterButton.getText()).toEqual("0");
        await counterButton.click();
        expect(await counterButton.getText()).toEqual("1");
        await reset();
      });
    });
  });

  describe("exposed methods", () => {
    describe("when resize buttons is clicked", () => {
      it("resizes window", async () => {
        const bounds = await getBounds();
        const maximizeButton = await browser.$("button#maximize");
        const unmaximizeButton = await browser.$("button#unmaximize");
        await maximizeButton.click();
        await waitFor(100);

        const biggerBounds = await getBounds();

        await expectMessage("Maximized");
        expect(biggerBounds.width).toBeGreaterThan(bounds.width);
        expect(biggerBounds.height).toBeGreaterThan(bounds.height);

        await unmaximizeButton.click();
        await waitFor(100);

        const lastBounds = await getBounds();

        await expectMessage("Unmaximized");
        expect(lastBounds.width).toEqual(bounds.width);
        expect(lastBounds.height).toEqual(bounds.height);
      });
    });

    describe("when menu interacted", () => {
      it("changes application menu visibility", async () => {
        const showMenuButton = await browser.$("button#show_menu");
        const hideMenuButton = await browser.$("button#hide_menu");

        await showMenuButton.click();
        expect(await browser.electron.browserWindow("isMenuBarVisible")).toEqual(true);

        await hideMenuButton.click();
        expect(await browser.electron.browserWindow("isMenuBarVisible")).toEqual(false);

        await showMenuButton.click();
        expect(await browser.electron.browserWindow("isMenuBarVisible")).toEqual(true);
      });

      it("triggers application menu click events", async () => {
        await reset();
        const apis = ["MenuItem_Label", "MenuItem_Id", "MenuItem_Accel", "MenuItem_Role"];

        for (const api of apis) {
          await browser.electron.api(api);
          await waitFor(100);
          await expectMessage(api);
          await reset();
        }
      });
    });
  });

  describe("keyboard events", () => {
    describe("when command pressed", () => {
      it("sends ctrl + c and ctrl + v command", async () => {
        await reset();
        await browser.keys(["Control", "c"]);
        await expectMessage("Ctrl + c pressed");

        await reset();
        await browser.keys(["Control", "v"]);
        await expectMessage("Ctrl + v pressed");
      });
    });
  });

  describe("dependency", () => {
    describe("when dependency method call button is pressed", () => {
      it("call dependency async methods", async () => {
        const callDepAsyncButton = await browser.$("#call-dep-async");
        const callDepAsyncDirectlyButton = await browser.$("#call-dep-async-directly");

        await reset();
        await callDepAsyncButton.click();
        await expectMessage("Asynchronous message from Dependency");

        await reset();
        await callDepAsyncDirectlyButton.click();
        await expectMessage("Asynchronous message from Dependency");
      });

      it("call dependency sync methods", async () => {
        const callDepSyncButton = await browser.$("#call-dep-sync");
        const callDepSyncDirectlyButton = await browser.$("#call-dep-sync-directly");

        await reset();
        await callDepSyncButton.click();
        await expectMessage("Synchronous message from Dependency");

        await reset();
        await callDepSyncDirectlyButton.click();
        await expectMessage("Synchronous message from Dependency");
      });

      it("call dependency sync methods as async", async () => {
        const callDepSyncAsyncButton = await browser.$("#call-dep-sync-async");
        const callDepSyncDirectlyAsyncButton = await browser.$("#call-dep-sync-directly-async");

        await reset();
        await callDepSyncAsyncButton.click();
        await expectMessage("Synchronous message from Dependency");

        await reset();
        await callDepSyncDirectlyAsyncButton.click();
        await expectMessage("Synchronous message from Dependency");
      });
    });
  });
});
