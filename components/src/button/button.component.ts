import { Input, Output, EventEmitter, HostBinding, OnChanges, Directive } from "@angular/core";

type ButtonTypes = "primary" | "secondary" | "danger";

const buttonStyles: Record<ButtonTypes, string> = {
  primary:
    "tw-border-primary-500 tw-bg-primary-500 tw-text-contrast hover:tw-bg-primary-700 hover:tw-border-primary-700",
  secondary:
    "tw-bg-transparent tw-bg-outline-background tw-border-outline-border tw-text-muted hover:tw-bg-secondary-500 hover:tw-border-secondary-500 hover:tw-text-contrast",
  danger:
    "tw-bg-transparent tw-border-danger-500 tw-text-danger hover:tw-bg-danger-500 hover:tw-border-danger-500 hover:tw-text-contrast",
};

@Directive({
  selector: "button[bit-button], a[bit-button]",
})
export class ButtonComponent implements OnChanges {
  @HostBinding("class") @Input("class") classList = "";

  @Input()
  buttonType: ButtonTypes = "secondary";

  @Input()
  block = false;

  /**
   * How large should the button be?
   */
  @Input()
  size: "small" | "medium" | "large" = "medium";

  /**
   * Optional click handler
   */
  @Output()
  onClick = new EventEmitter<Event>();

  ngOnChanges() {
    this.classList = this.classes.join(" ");
  }

  get classes(): string[] {
    return [
      "tw-font-semibold tw-text-sm tw-py-1.5 tw-px-3 tw-rounded tw-transition tw-border tw-border-solid tw-text-center hover:tw-no-underline",
      "disabled:tw-bg-secondary-100 disabled:tw-border-secondary-100 disabled:tw-text-main",
      "focus:tw-outline-none focus:tw-ring focus:tw-ring-offset-1 focus:tw-ring-primary-700",
      this.block ? "tw-w-full tw-block" : "",
      buttonStyles[this.buttonType],
    ];
  }
}
