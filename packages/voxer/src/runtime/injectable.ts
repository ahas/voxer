import type { AccessorMethod, CommandHandler, ExposedMethod } from "./core/decorators";

export interface InjectableMetadata<T = any> {
  name: string;
  apiKey: string;
  methods: ExposedMethod<T>[];
  commands: CommandHandler<T>[];
  accessors: AccessorMethod<T>[];
}
