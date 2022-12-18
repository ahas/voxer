import chalk, { type BackgroundColor, type ForegroundColor } from "chalk";

type ConsoleColor = typeof BackgroundColor | typeof ForegroundColor;

function label(type: string, ...colors: ConsoleColor[]) {
  return colors.reduce((a, b) => chalk[b](a), type) + "VOXER:";
}

export function consoleLog(msg: any, ...params: any[]) {
  console.log(`${label("➤ ")} ${msg}`, ...params);
}

export function consoleInfo(msg: any, ...params: any[]) {
  console.info(`${label("➤ ", "blue")} ${msg}`, ...params);
}

export function consoleError(msg: any, ...params: any[]) {
  console.error(`${label("➤ ", "red")} ${msg}`, ...params);
}

export function consoleWarn(msg: any, ...params: any[]) {
  console.warn(`${label("➤ ", "yellow")} ${msg}`, ...params);
}

export function consoleStart(msg: any, ...params: any[]) {
  console.info(`${label("➤ ", "blue")} ${msg}`, ...params);
}

export function consoleDel(msg: any, ...params: any[]) {
  console.info(`${label("➤ ", "red")} ${msg}`, ...params);
}
