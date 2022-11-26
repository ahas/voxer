interface InjectableOptions {
  inject: Function[];
}

export interface InjectableOptions {
  as?: string;
}

export interface AccessorOptions {
  getter?: string;
  setter?: string;
  as?: string;
}

export interface ExposeOptions {
  as?: string;
}

export function Injectable(options?: InjectableOptions): ClassDecorator;
export function Expose(options?: ExposeOptions): MethodDecorator;
export function Accessor(options?: AccessorOptions): PropertyDecorator;
export function Command(combinations: string | string[]): MethodDecorator;
export function MenuItem(selector: string | string[]): MethodDecorator;
export function OnRenderer(channel: string): MethodDecorator;
export function OnMain(channel: string): MethodDecorator;
