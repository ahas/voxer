interface InjectableOptions {
    inject: Function[];
}

interface ExposeOptions {
    api: string;
}

export function Injectable(options?: InjectableOptions): ClassDecorator;
export function Expose(options?: ExposeOptions): MethodDecorator;
