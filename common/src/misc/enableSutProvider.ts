import "reflect-metadata";

/**
 * SutProvider uses the emitDecoratorMetadata option (set in tsconfig) to get constructor argument types at runtime.
 * Use this as a class decorator if you want to use SutProvider on a class that does not otherwise have a decorator.
 */
export function enableSutProvider(target: any) {
  // Do nothing

  // getMetadata can sometimes return undefined - maybe due to the order of class declarations in the transpiled js.
  // See https://github.com/microsoft/TypeScript/issues/4114
  // Calling getMetadata here appears to resolve the issue
  Reflect.getMetadata("design:paramtypes", target);
}
