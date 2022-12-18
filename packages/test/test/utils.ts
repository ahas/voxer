type Bounds = { width: number; height: number };

export const waitFor = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
export const getBounds = (): Promise<Bounds> => browser.electronBrowserWindow("getBounds") as Promise<Bounds>;
