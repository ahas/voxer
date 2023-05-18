type Bounds = { width: number; height: number };

export const waitFor = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
export const getBounds = (): Promise<Bounds> => browser.electron.browserWindow("getBounds") as Promise<Bounds>;

export async function reset() {
  const counterButton = await browser.$("button#counter");
  const resetButton = await browser.$("button#reset");

  await resetButton.click();
  await waitFor(100);
  expect(await counterButton.getText()).toEqual("0");
  await expectMessage("Reset");
  await waitFor(100);
}

export async function expectMessage(msg: string) {
  const messageP = await browser.$("p#message");

  expect(await messageP.getText()).toEqual(msg);
}
