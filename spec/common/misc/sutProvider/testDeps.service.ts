export class Dep1 {
  once() {
    throw new Error("Dependency not mocked correctly");
  }
}

export class Dep2 {
  twice() {
    throw new Error("Dependency not mocked correctly");
  }
}

export class Dep3 {
  thrice() {
    throw new Error("Dependency not mocked correctly");
  }
}
