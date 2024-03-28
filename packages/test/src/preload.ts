export async function preload() {
  process.env.TEST === "true" && (await import("./preload/wdio/preload"));
}
