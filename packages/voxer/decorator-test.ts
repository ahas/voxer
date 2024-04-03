const methods = [] as any[];

function ClassDecorator(target: any, context: ClassDecoratorContext) {
  console.log("class", target);
}

function MethodDecorator(target: any, context: ClassMethodDecoratorContext) {
  console.log("method", target);
  console.log("context", context);
  target();

  return function (this: any, ...args: any[]) {};
}

function loggedMethod<Fn extends (...args: any[]) => any>(
  target: Fn,
  context: ClassMethodDecoratorContext<ThisParameterType<Fn>, Fn>
) {
  const methodName = String(context.name);
  return function replacementMethod(
    this: ThisParameterType<Fn>,
    ...args: Parameters<Fn>
  ) {
    console.log(`LOG : Entering Method "${methodName}"`);
    const result = target.call(this, ...args);
    console.log(`LOG : Exiting Method "${methodName}"`);
    return result;
  };
}

@ClassDecorator
class App {
  @MethodDecorator
  method() {
    console.log("method called", this);
  }
}

const app = new App();

console.log(methods);
