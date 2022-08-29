export function getMetadataStorage(): VoxerMetadataStorage;

export interface VoxerMetadataArgs {
  readonly target: Function;
  readonly propertyName: string;
  readonly type: CrudHooks;
}

export enum VoxerParamTypes {
  EXPOSE = "EXPOSE",
}

export class VoxerMetadataStorage {
  readonly listeners: Map<string, VoxerMetadataArgs[]>;

  constructor();

  on(name: string, args: VoxerMetadataArgs): this;

  emit<T>(
    injectable: InjectableTarget,
    name: string,
    type: CrudHooks,
    params: {
      [key in VoxerParamTypes]?: any;
    }
  ): T | undefined;

  get(name: string): VoxerMetadataArgs[];
}
