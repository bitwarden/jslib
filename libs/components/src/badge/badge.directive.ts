import { Directive, ElementRef, HostBinding, Input } from "@angular/core";

type BadgeTypes = "primary" | "secondary" | "success" | "danger" | "warning" | "info";

const styles: Record<BadgeTypes, string[]> = {
  primary: ["tw-bg-primary-500"],
  secondary: ["tw-bg-text-muted"],
  success: ["tw-bg-success-500"],
  danger: ["tw-bg-danger-500"],
  warning: ["tw-bg-warning-500"],
  info: ["tw-bg-info-500"],
};

const hoverStyles: Record<BadgeTypes, string[]> = {
  primary: ["hover:tw-bg-primary-700"],
  secondary: ["hover:tw-bg-secondary-700"],
  success: ["hover:tw-bg-success-700"],
  danger: ["hover:tw-bg-danger-700"],
  warning: ["hover:tw-bg-warning-700"],
  info: ["hover:tw-bg-info-700"],
};

@Directive({
  selector: "span[bitBadge], a[bitBadge], button[bitBadge]",
})
export class BadgeDirective {
  @HostBinding("class") get classList() {
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
    ]
      .concat(styles[this.badgeType])
      .concat(this.hasHoverEffects ? hoverStyles[this.badgeType] : []);
  }

  @Input() badgeType: BadgeTypes = "primary";

  private hasHoverEffects = false;

  constructor(el: ElementRef<Element>) {
    this.hasHoverEffects = el?.nativeElement?.nodeName != "SPAN";
  }
}
