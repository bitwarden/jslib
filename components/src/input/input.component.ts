import { Directive, HostBinding, Input } from "@angular/core";

@Directive({
  selector: "input[bitInput]",
})
export class BitInput {
  @HostBinding("class") @Input() classList = [
    "tw-block",
    "tw-px-3",
    "tw-py-1.5",
    "tw-bg-background-alt",
    "tw-border",
    "tw-border-solid",
    "tw-border-secondary-500",
    "tw-rounded",
    "tw-text-main",
    "tw-placeholder-text-muted",
    "focus:tw-outline-primary-700",
    "disabled:tw-bg-secondary-100",
  ];
}
