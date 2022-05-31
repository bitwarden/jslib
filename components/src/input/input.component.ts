import { Directive, HostBinding, Input, OnChanges, OnInit } from "@angular/core";
import { FormFieldControl } from "src/form-field/form-field-control";

let nextUniqueId = 0;

@Directive({
  selector: "input[bit-input], textarea[bit-input]",
  host: {
    "[required]": "required",
    "[attr.name]": "name || null",
    "[attr.aria-invalid]": "(empty && required) ? null : errorState",
    "[attr.aria-required]": "required",
  },
})
export class BitInput extends FormFieldControl<any> implements OnInit, OnChanges {
  @HostBinding("class") @Input("class") classList = "";
  override value: any;
  @Input() override id = `bit-input-${nextUniqueId++}`;
  @HostBinding() @Input() override required = false;
  @HostBinding() @Input() override disabled = false;
  override inError: boolean;
  inFocus: boolean;

  ngOnInit(): void {
    this.classList = this.classes.join(" ");
  }

  ngOnChanges() {
    this.ngOnInit();
  }

  private get classes() {
    return [
      "tw-grow",
      "tw-block",
      this.disabled ? "tw-bg-secondary-100" : "tw-bg-background-alt",
      "tw-border",
      "tw-border-solid",
      "tw-border-secondary-500",
      "tw-rounded",
    ];
  }

  private get borderColorClass() {
    if (this.disabled) {
      return "tw-border-secondary-500";
    }

    if (this.inError) {
      return "tw-border-danger-500";
    }

    return this.inFocus ? "tw-border-primary-700" : "tw-border-secondary-500";
  }
}
