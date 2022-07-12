const { INJECTABLE_OPTIONS_METADATA, INJECTED_INSTANCE_METADATA } = require("./constants");

global.__voxer = {
    injectedInstances: [],
};

const circularInjection = {};

function inject(injectable) {
    const found = __voxer.injectedInstances.find((x) => x instanceof injectable);
    if (found) {
        return found;
    }

    const name = injectable.name;

    if (circularInjection[name]) {
        console.log("Circular dependency injection detected: %s", name);
    }

    circularInjection[name] = true;
    const paramTypes = Reflect.getMetadata("design:paramtypes", injectable);
    const options = Reflect.getMetadata(INJECTABLE_OPTIONS_METADATA, injectable);
    const args = [];

    if (paramTypes) {
        for (const paramType of paramTypes) {
            const arg = options.inject.find((x) => x === paramType);
            if (arg) {
                args.push(inject(arg));
            } else {
                args.push(undefined);
            }
        }
    }

    const instance = new injectable(...args);
    Reflect.defineMetadata(INJECTED_INSTANCE_METADATA, instance, injectable);
    __voxer.injectedInstances.push(instance);

    circularInjection[name] = false;

    return instance;
}

module.exports = function (getInjectables) {
    if (!getInjectables) {
        return;
    }

    const injectables = getInjectables();

    for (const injectable of injectables) {
        inject(injectable);
    }

    return injectables
};
