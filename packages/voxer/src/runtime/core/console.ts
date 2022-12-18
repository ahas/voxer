function label(type: string) {
  return type + "VOXER:";
}

export function consoleLog(msg: any, ...params: any[]) {
  console.log(`${label("➤ ")} ${msg}`, ...params);
}

export function consoleInfo(msg: any, ...params: any[]) {
  console.info(`${label("➤ ")} ${msg}`, ...params);
}

export function consoleError(msg: any, ...params: any[]) {
  console.error(`${label("➤ ")} ${msg}`, ...params);
}

export function consoleWarn(msg: any, ...params: any[]) {
  console.warn(`${label("➤ ")} ${msg}`, ...params);
}

export function consoleStart(msg: any, ...params: any[]) {
  console.info(`${label("➤ ")} ${msg}`, ...params);
}

export function consoleDel(msg: any, ...params: any[]) {
  console.info(`${label("➤ ")} ${msg}`, ...params);
}
