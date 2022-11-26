function asExposeEvent(injectable, name) {
  return `$voxer:injectable:${injectable.name}:expose:${name}`;
}

function asGetter(injectable, name) {
  return `$voxer:injectable:${injectable.name}:getter:${name}`;
}

function asSetter(injectable, name) {
  return `$voxer:injectable:${injectable.name}:setter:${name}`;
}

function asCommandEvent(injectable, name) {
  return `$voxer:injectable:${injectable.name}:command:${name}`;
}

function asMenuEvent(selector) {
  return `$voxer:menu:${selector}`;
}

function asAsync(eventName) {
  return eventName + ":async";
}

function camelcase(s, ...strs) {
  let result = s[0].toLowerCase() + s.substring(1);

  for (const str of strs) {
    result += str[0].toUpperCase() + str.substring(1);
  }

  return result;
}

function isAsyncFunction(f) {
  return f.constructor.name === "AsyncFunction";
}

module.exports.asExposeEvent = asExposeEvent;
module.exports.asGetter = asGetter;
module.exports.asSetter = asSetter;
module.exports.asMenuEvent = asMenuEvent;
module.exports.asCommandEvent = asCommandEvent;
module.exports.asAsync = asAsync;
module.exports.camelcase = camelcase;
module.exports.isAsyncFunction = isAsyncFunction;
