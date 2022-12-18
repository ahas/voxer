import type { InjectableMetadata } from "../injectable";

type Key = string | symbol | number;

export function asExposeEvent(injectable: Function | InjectableMetadata, name: Key): string {
  return `$voxer:injectable:${injectable.name}:expose:${String(name)}`;
}

export function asGetter(injectable: Function | InjectableMetadata, name: Key): string {
  return `$voxer:injectable:${injectable.name}:getter:${String(name)}`;
}

export function asSetter(injectable: Function | InjectableMetadata, name: Key): string {
  return `$voxer:injectable:${injectable.name}:setter:${String(name)}`;
}

export function asCommandEvent(injectable: Function | InjectableMetadata, name: Key): string {
  return `$voxer:injectable:${injectable.name}:command:${String(name)}`;
}

export function asMenuEvent(selector: string): string {
  return `$voxer:menu:${selector}`;
}

export function asAsync(eventName: string): string {
  return eventName + ":async";
}

export function camelcase(s: string, ...strs: string[]): string {
  let result = s[0].toLowerCase() + s.substring(1);

  for (const str of strs) {
    result += str[0].toUpperCase() + str.substring(1);
  }

  return result;
}

export function isAsyncFunction(f: any): boolean {
  return f.constructor.name === "AsyncFunction";
}
