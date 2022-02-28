import { Component, Input } from "@angular/core";

type BadgeTypes = "primary" | "secondary" | "success" | "danger" | "warning" | "info";

const styles: Record<BadgeTypes, string[]> = {
  primary: ["tw-bg-primary-500", "hover:tw-bg-primary-700"],
  secondary: ["tw-bg-secondary-500", "hover:tw-bg-secondary-700"],
  success: ["tw-bg-success-500", "hover:tw-bg-success-700"],
  danger: ["tw-bg-danger-500", "hover:tw-bg-danger-700"],
  warning: ["tw-bg-warning-500", "hover:tw-bg-warning-700"],
  info: ["tw-bg-info-500", "hover:tw-bg-info-700"],
};

@Component({
  selector: "bit-badge",
  template: `<span [ngClass]="classes"><ng-content></ng-content></span>`,
})
export class BadgeComponent {
  @Input()
  type: BadgeTypes = "primary";

  get classes() {
    return [
      "tw-inline-block",
      "tw-py-0.5",
      "tw-px-1",
      "tw-font-bold",
      "tw-leading-none",
      "tw-text-center",
      "tw-text-contrast",
      "tw-align-baseline",
      "tw-rounded",
      "tw-border-collapse",
      "tw-box-border",
      "tw-whitespace-no-wrap",
      "tw-text-xs",
    ].concat(styles[this.type]);
  }
}
