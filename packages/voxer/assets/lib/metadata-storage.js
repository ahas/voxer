const { ARGS_METADATA } = require("./constants");

function getMetadataStorage() {
  if (!global.voxerMetadataStorage) {
    global.voxerMetadataStorage = new VoxerMetadataStorage();
  }
  return global.voxerMetadataStorage;
}

class VoxerMetadataStorage {
  constructor() {
    this.methods = new Map();
  }

  on(name, args) {
    if (!this.methods.has(name)) {
      this.methods.set(name, []);
    }

    this.methods.get(name)?.push(args);

    return this;
  }

  emit(name, type, params) {
    let returnValue;

    this.methods.get(name)?.forEach((x) => {
      if (x.type === type) {
        const metadata = Reflect.getMetadata(ARGS_METADATA, x.target.constructor, x.propertyName);
        const args = [];
        for (const key in metadata) {
          const m = metadata[key];
          args[m.index] = params[m.type];
        }
        const method = x.target[x.propertyName];

        returnValue = method.apply(null, args) || returnValue;
      }
    });

    return returnValue;
  }

  get(name) {
    return this.methods.get(name);
  }
}

module.exports.getMetadataStorage = getMetadataStorage;
module.exports.VoxerMetadataStorage = VoxerMetadataStorage;
