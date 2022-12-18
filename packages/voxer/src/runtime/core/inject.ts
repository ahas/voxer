import { voxer } from "./voxer.main";
import { INJECTABLE_OPTIONS_METADATA, INJECTABLE_INSTANCE_METADATA } from "./constants";
import { consoleError } from "./console";

const circularInjection = new Map<string, boolean>();

export function inject<T extends Object>(injectable: { new (...args: any[]): T }): T {
  const found = voxer.instances.find((x) => x instanceof injectable);

  if (found) {
    return found as T;
  }

  const name = injectable.name;

  if (circularInjection.get(name)) {
    consoleError("Circular dependency injection detected: %s", name);
  }

  circularInjection.set(name, true);
  const paramTypes = Reflect.getMetadata("design:paramtypes", injectable);
  const options = Reflect.getMetadata(INJECTABLE_OPTIONS_METADATA, injectable);
  const args: any = [];

  if (paramTypes) {
    for (const paramType of paramTypes) {
      const arg = options.inject.find((x: any) => x === paramType);

      if (arg) {
        args.push(inject(arg));
      } else {
        args.push(undefined);
      }
    }
  }

  const instance = new injectable(...args);
  Reflect.defineMetadata(INJECTABLE_INSTANCE_METADATA, instance, injectable);
  voxer.injectables.push(injectable);
  voxer.instances.push(instance);

  circularInjection.set(name, false);

  return instance;
}
