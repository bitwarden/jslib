import { Directive, HostBinding, Input, Optional, Self } from "@angular/core";
import { NgControl, Validators } from "@angular/forms";

// Increments for each instance of the input component
let nextId = 0;

@Directive({
  selector: "input[bitInput]",
  host: {
    "[attr.id]": "id",
    "[required]": "required",
  },
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

  id = `bit-input-${nextId++}`;

  @Input()
  get required() {
    return this._required ?? this.ngControl?.control?.hasValidator(Validators.required) ?? false;
  }
  set required(value: any) {
    this._required = value != null && value !== false;
  }
  private _required: boolean;

  constructor(@Optional() @Self() private ngControl: NgControl) {}
}
