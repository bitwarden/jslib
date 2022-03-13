import Substitute, { SubstituteOf } from "@fluffy-spoon/substitute";

import "reflect-metadata";

/**
 * SutProvider uses the emitDecoratorMetadata option (set in tsconfig) to get constructor argument types at runtime.
 * Use this as a class decorator if you want to use SutProvider on a class that does not otherwise have a decorator.
 */
export function enableSutProvider(target: any) {
  // Do nothing
}

/**
 * A helper class that will automatically create a sut and use mocks for all dependencies.
 */
export class SutProvider<T> {
  readonly sut: T;
  private dependencies = new Map<any, any>();

  constructor(sutType: any) {
    const dependencyMetadata = Reflect.getMetadata("design:paramtypes", sutType);
    const mocks: any = [];

    dependencyMetadata.forEach((depType: any) => {
      const mock = this.createMock();
      mocks.push(mock);
      this.dependencies.set(depType, mock);
    });

    this.sut = new sutType(...mocks);
  }

  getDependency<T>(depType: any): SubstituteOf<T> {
    return this.dependencies.get(depType);
  }

  private createMock() {
    return Substitute.for();
  }
}
