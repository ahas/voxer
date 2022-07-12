const { getMetadataStorage } = require("./metadata-storage");
const { INJECTABLE_MARK, INJECTABLE_OPTIONS_METADATA } = require("./constants");

function Injectable(options) {
    return function (target) {
        Reflect.defineMetadata(INJECTABLE_MARK, true, target);
        Reflect.defineMetadata(INJECTABLE_OPTIONS_METADATA, options, target);
    };
}

function Expose(options) {
    options = options || {};
    options.api = options.api || "api";

    return function (target, methodName) {
        if (!target.constructor.__exposedMethods) {
            target.constructor.__exposedMethods = [];
        }

        target.constructor.__exposedMethods.push(methodName);
    };
}

module.exports.Injectable = Injectable;
module.exports.Expose = Expose;
