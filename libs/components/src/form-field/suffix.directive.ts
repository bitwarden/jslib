import { Directive, HostBinding, Input } from "@angular/core";

import { PrefixClasses } from "./prefix.directive";

@Directive({
  selector: "[bitSuffix]",
})
export class BitSuffixDirective {
  @HostBinding("class") @Input() get classList() {
    return PrefixClasses.concat([
      "tw-rounded-l-none",
      "tw-border-l-0",
      !this.last ? "tw-rounded-r-none" : "",
    ]).filter((c) => c != "");
  }

  @Input() last = false;
}
