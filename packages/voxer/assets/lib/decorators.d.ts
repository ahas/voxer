interface InjectableOptions {
  inject: Function[];
}

interface ExposeOptions {
  api: string;
}

export function Injectable(options?: InjectableOptions): ClassDecorator;
export function Expose(options?: ExposeOptions): MethodDecorator;
export function Command(combinations: string | string[]): MethodDecorator;
export function OnRenderer(channel: string): MethodDecorator;
export function OnMain(channel: string): MethodDecorator;
