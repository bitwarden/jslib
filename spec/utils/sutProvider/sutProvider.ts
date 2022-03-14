import Substitute, { SubstituteOf } from "@fluffy-spoon/substitute";

import "reflect-metadata";

/**
 * A helper class that will automatically create a sut and use mocks for all dependencies.
 */
export class SutProvider<T> {
  readonly sut: T;
  private dependencies = new Map<any, any>();

  constructor(sutType: any) {
    const dependencyMetadata = Reflect.getOwnMetadata("design:paramtypes", sutType);
    if (dependencyMetadata == null) {
      throw new Error(
        "No class metadata found. Make sure your sut has a decorator (e.g. @enableSutProvider) and emitDecoratorMetadata is enabled in tsconfig."
      );
    }

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
