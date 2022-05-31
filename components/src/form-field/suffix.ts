import { Directive } from "@angular/core";

@Directive({
  selector: "[bit-suffix]",
  host: {
    class: "bit-suffix text-right",
  },
})
export class BitSuffix {}
