const { VOXER_ARGS_METADATA } = require("./metadata-storage");

const MAIN_WINDOW = 0;
const ARGUMENTS = 1;

function assignMetadata(args, type, index, data, ...pipes) {
  return {
    ...args,
    [`${type}:${index}`]: {
      type: type,
      index,
      data,
      pipes,
    },
  };
}

function createCrudParamDecorator(paramType) {
  return (data) => (target, key, index) => {
    const args = Reflect.getMetadata(VOXER_ARGS_METADATA, target.constructor, key) || {};
    Reflect.defineMetadata(VOXER_ARGS_METADATA, assignMetadata(args, paramType, index, data), target.constructor, key);
  };
}

const MainWindow = createCrudParamDecorator(MAIN_WINDOW);
const Args = createCrudParamDecorator(ARGUMENTS);

module.exports.MainWindow = MainWindow;
module.exports.Args = Args;
