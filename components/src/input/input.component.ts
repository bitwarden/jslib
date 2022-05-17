import { Directive, HostBinding, Input, Optional, Self } from "@angular/core";
import { NgControl, Validators } from "@angular/forms";

// Increments for each instance of the input component
let nextId = 0;

@Directive({
  selector: "input[bitInput], select[bitInput], textarea[bitInput]",
  host: {
    "[attr.id]": "id",
    "[attr.aria-describedby]": "ariaDescribedBy",
    "[required]": "required",
  },
})
export class BitInput {
  @HostBinding("class") @Input() get classList() {
    return [
      "tw-block",
      "tw-w-full",
      "tw-px-3",
      "tw-py-1.5",
      "tw-bg-background-alt",
      "tw-border",
      "tw-border-solid",
      "tw-rounded",
      "tw-text-main",
      "tw-placeholder-text-muted",
      "focus:tw-outline-none",
      "focus:tw-border-primary-700",
      "focus:tw-ring-1",
      "focus:tw-ring-primary-700",
      "focus:tw-z-10",
      "disabled:tw-bg-secondary-100",
      this.hasPrefix ? "tw-rounded-l-none" : "",
      this.hasSuffix ? "tw-rounded-r-none" : "",
      this.hasError ? "tw-border-danger-500" : "tw-border-secondary-500",
    ].filter((s) => s != "");
  }

  id = `bit-input-${nextId++}`;

  @Input()
  get required() {
    return this._required ?? this.ngControl?.control?.hasValidator(Validators.required) ?? false;
  }
  set required(value: any) {
    this._required = value != null && value !== false;
  }
  private _required: boolean;

  @Input() hasPrefix = false;
  @Input() hasSuffix = false;

  get hasError() {
    return this.ngControl?.status === "INVALID" && this.ngControl?.touched;
  }

  get error() {
    return Object.keys(this.ngControl.errors)[0];
  }

  ariaDescribedBy: string;

  constructor(@Optional() @Self() private ngControl: NgControl) {}
}
