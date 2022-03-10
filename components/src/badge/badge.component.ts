import { Directive, HostBinding, Input, OnChanges } from "@angular/core";

type BadgeTypes = "primary" | "secondary" | "success" | "danger" | "warning" | "info";

const styles: Record<BadgeTypes, string[]> = {
  primary: ["tw-bg-primary-500", "hover:tw-bg-primary-700"],
  secondary: ["tw-bg-text-muted", "hover:tw-bg-secondary-700"],
  success: ["tw-bg-success-500", "hover:tw-bg-success-700"],
  danger: ["tw-bg-danger-500", "hover:tw-bg-danger-700"],
  warning: ["tw-bg-warning-500", "hover:tw-bg-warning-700"],
  info: ["tw-bg-info-500", "hover:tw-bg-info-700"],
};

@Directive({
  selector: "span[bit-badge], a[bit-badge], button[bit-badge]",
})
export class BadgeComponent implements OnChanges {
  @HostBinding("class") @Input("class") classList = "";

  @Input() badgeType: BadgeTypes = "primary";

  ngOnChanges() {
    this.classList = this.classes.join(" ");
  }

  get classes() {
    return [
      "tw-inline-block",
      "tw-py-1",
      "tw-px-1.5",
      "tw-font-bold",
      "tw-leading-none",
      "tw-text-center",
      "!tw-text-contrast",
      "tw-rounded",
      "tw-border-none",
      "tw-box-border",
      "tw-whitespace-no-wrap",
      "tw-text-xs",
      "hover:tw-no-underline",
      "focus:tw-outline-none",
      "focus:tw-ring",
      "focus:tw-ring-offset-2",
      "focus:tw-ring-primary-700",
    ].concat(styles[this.badgeType]);
  }
}
