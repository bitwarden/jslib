import SubstituteOf from "@fluffy-spoon/substitute";

import { SutProvider } from "./sutProvider";

const mockObject = SubstituteOf;
const notMockedError = () => {
  throw new Error("Dependency not mocked correctly");
};

class TestSut {
  constructor(private dep1: Dep1, private dep2: Dep2, private dep3: Dep3) {}

  run() {
    this.dep2.spy();
    return this.dep1.foo() + this.dep2.bar() * this.dep3.baz();
  }
}

class Dep1 {
  foo(): number {
    return notMockedError();
  }
}

class Dep2 {
  bar(): number {
    return notMockedError();
  }

  spy() {
    throw new Error("Dependency not mocked correctly");
  }
}

class Dep3 {
  baz(): number {
    return notMockedError();
  }
}

describe("SutProvider", () => {
  let sutProvider: SutProvider<TestSut>;

  beforeEach(() => {
    sutProvider = new SutProvider(TestSut);
  });

  it("creates the sut", () => {
    expect(sutProvider.service()).toBeInstanceOf(TestSut);
  });

  it("creates mock dependencies", () => {
    expect(sutProvider.dependency(Dep1)).toBeInstanceOf(mockObject);
    expect(sutProvider.dependency(Dep2)).toBeInstanceOf(mockObject);
    expect(sutProvider.dependency(Dep3)).toBeInstanceOf(mockObject);
  });

  it("retrieves the correct mock dependencies", () => {
    sutProvider.dependency<Dep1>(Dep1).foo().returns(4);
    sutProvider.dependency<Dep2>(Dep2).bar().returns(6);
    sutProvider.dependency<Dep3>(Dep3).baz().returns(9);

    const result = sutProvider.service().run();
    expect(result).toBe(90);
    expect(sutProvider.dependency<Dep2>(Dep2).received(1).spy());
  });
});
