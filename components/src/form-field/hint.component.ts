import { Directive, HostBinding, Input } from "@angular/core";

@Directive({
  selector: "bit-hint",
})
export class BitHintComponent {
  @HostBinding("class") @Input() classList = ["tw-text-muted", "tw-inline-block", "tw-mt-1"];
}
