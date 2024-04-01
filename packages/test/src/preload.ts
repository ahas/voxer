export async function preload() {
  process.env.TEST === "true" && require("./preload/wdio/preload");
}
