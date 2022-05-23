import { Directive } from "@angular/core";

@Directive({
  selector: "bit-hint",
  host: {
    class: "tw-text-muted tw-inline-block tw-mt-1",
  },
})
export class BitHintComponent {}
