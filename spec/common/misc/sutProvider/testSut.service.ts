import { enableSutProvider } from "./sutProvider";
import { Dep1, Dep2, Dep3 } from "./testDeps.service";

@enableSutProvider
export class TestSut {
  constructor(private dep1: Dep1, private dep2: Dep2, private dep3: Dep3) {}

  run() {
    this.dep1.once();

    this.dep2.twice();
    this.dep2.twice();

    this.dep3.thrice();
    this.dep3.thrice();
    this.dep3.thrice();
  }
}
