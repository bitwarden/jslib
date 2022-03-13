/**
 * SutProvider uses the emitDecoratorMetadata option (set in tsconfig) to get constructor argument types at runtime.
 * Use this as a class decorator if you want to use SutProvider on a class that does not otherwise have a decorator.
 */
export function enableSutProvider(target: any) {
  // Do nothing
}
