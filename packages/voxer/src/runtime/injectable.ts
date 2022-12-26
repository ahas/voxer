import type { AccessorMethod, CommandHandler, ExposedMethod, InvokeHook } from "./core/decorators";

export interface InjectableMetadata<T = any> {
  name: string;
  apiKey: string;
  methods: ExposedMethod<T>[];
  hooks: InvokeHook<T>[];
  commands: CommandHandler<T>[];
  accessors: AccessorMethod<T>[];
}
