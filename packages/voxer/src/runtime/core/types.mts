export interface InjectableOptions {
  inject?: Function[];
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

export interface MethodMetadata<T> {
  methodName: keyof T;
  isAsync: boolean;
}

export interface ExposedMethod<T> extends MethodMetadata<T> {
  options?: ExposeOptions;
}

export interface InvokeHook<T> {
  methodName: keyof T;
  channel: string;
  rendererChannel: string;
}

export interface AccessorMethod<T> {
  propertyKey: keyof T;
  options?: AccessorOptions;
}

export interface CommandHandler<T> extends MethodMetadata<T> {
  combinations: string | string[];
}

export interface MenuItemHandler<T> extends MethodMetadata<T> {
  selector: string | string[];
}
