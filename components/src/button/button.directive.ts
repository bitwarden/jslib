import { Input, HostBinding, Directive } from "@angular/core";

export type ButtonTypes = "primary" | "secondary" | "danger";

const buttonStyles: Record<ButtonTypes, string[]> = {
  primary: [
    "tw-border-primary-500",
    "tw-bg-primary-500",
    "!tw-text-contrast",
    "hover:tw-bg-primary-700",
    "hover:tw-border-primary-700",
    "focus:tw-bg-primary-700",
    "focus:tw-border-primary-700",
  ],
  secondary: [
    "tw-bg-transparent",
    "tw-border-text-muted",
    "!tw-text-muted",
    "hover:tw-bg-secondary-500",
    "hover:tw-border-secondary-500",
    "hover:!tw-text-contrast",
    "focus:tw-bg-secondary-500",
    "focus:tw-border-secondary-500",
    "focus:!tw-text-contrast",
  ],
  danger: [
    "tw-bg-transparent",
    "tw-border-danger-500",
    "!tw-text-danger",
    "hover:tw-bg-danger-500",
    "hover:tw-border-danger-500",
    "hover:!tw-text-contrast",
    "focus:tw-bg-danger-500",
    "focus:tw-border-danger-500",
    "focus:!tw-text-contrast",
  ],
};

@Directive({
  selector: "button[bitButton], a[bitButton]",
})
export class ButtonDirective {
  @HostBinding("class") get classList() {
    return [
      "tw-font-semibold",
      "tw-py-1.5",
      "tw-px-3",
      "tw-rounded",
      "tw-transition",
      "tw-border",
      "tw-border-solid",
      "tw-text-center",
      "hover:tw-no-underline",
      "disabled:tw-bg-secondary-100",
      "disabled:tw-border-secondary-100",
      "disabled:!tw-text-main",
      "focus:tw-outline-none",
      "focus:tw-ring",
      "focus:tw-ring-offset-2",
      "focus:tw-ring-primary-700",
      "focus:tw-z-10",
    ]
      .concat(this.block ? ["tw-w-full", "tw-block"] : ["tw-inline-block"])
      .concat(buttonStyles[this.buttonType] ?? []);
  }

  @Input()
  buttonType: ButtonTypes = "secondary";

  @Input()
  block = false;
}
