import { Component, Input } from "@angular/core";

@Component({
  selector: "bit-tab-item",
  templateUrl: "./tab-item.component.html",
})
export class TabItemComponent {
  @Input() route: string; // ['/route']
  @Input() disabled = false;

  get baseClassList(): string {
    return [
      "tw-block",
      "tw-py-2",
      "tw-px-4",
      "tw-leading-5", // Necessary? - sets line height
      "tw-text-left",
      "tw-font-semibold",
      "tw-bg-transparent",
      "tw-transition",
      "tw-rounded-t",
      "tw-border-0",
      "tw-border-t-4",
      "tw-border-t-transparent",
      "tw-border-b",
      "tw-border-b-secondary-300",
      "tw-border-solid",
      "tw-cursor-pointer",
      "tw-box-border", // Necessary? - compounds final width/height of tab to include borders
      "tw-text-main",
      "hover:tw-border-t-4",
      "hover:tw-border-t-secondary-700",
      "hover:tw-no-underline",
      "focus:tw-border-t-secondary-700",
      "focus:tw-outline-none",
      "focus:tw-ring-2",
      "focus:tw-ring-primary-700",
      "disabled:tw-bg-secondary-100",
      "disabled:tw-text-muted",
      "disabled:tw-border-t-transparent",
      "disabled:tw-cursor-not-allowed",
    ].join(" ");
  }

  get activeClassList(): string {
    return [
      "tw-border-x",
      "tw-border-x-secondary-300",
      "tw-border-t-primary-500",
      "tw-border-b-transparent",
      "tw-text-primary-500",
    ].join(" ");
  }
}
