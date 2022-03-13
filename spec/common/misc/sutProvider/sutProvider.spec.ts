import { SutProvider } from "./sutProvider";
import { Dep1, Dep2, Dep3 } from "./testDeps.service";
import { TestSut } from "./testSut.service";

describe("SutProvider", () => {
  let sutProvider: SutProvider<TestSut>;

  // Properties on SubstituteOf proxies
  const isMock = (obj: any) =>
    obj.received != null && obj.didNotReceive != null && obj.mimick != null;

  beforeEach(() => {
    sutProvider = new SutProvider(TestSut);
  });

  it("creates the sut", () => {
    expect(sutProvider.sut).toBeInstanceOf(TestSut);
  });

  it("creates mock dependencies", () => {
    expect(isMock(sutProvider.getDependency(Dep1))).toBeTrue;
    expect(isMock(sutProvider.getDependency(Dep2))).toBeTrue;
    expect(isMock(sutProvider.getDependency(Dep3))).toBeTrue;
  });

  it("retrieves the correct mock dependencies", () => {
    sutProvider.sut.run();
    expect(sutProvider.getDependency<Dep1>(Dep1).received(1).once());
    expect(sutProvider.getDependency<Dep2>(Dep2).received(2).twice());
    expect(sutProvider.getDependency<Dep3>(Dep3).received(3).thrice());
  });
});
