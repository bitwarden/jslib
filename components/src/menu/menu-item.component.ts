import { FocusableOption } from "@angular/cdk/a11y";
import { Component, ElementRef } from "@angular/core";

@Component({
  selector: "[bit-menu-item]",
  host: {
    class:
      "tw-block tw-py-1 tw-px-6 !tw-text-main !tw-no-underline tw-cursor-pointer tw-border-none tw-bg-background tw-text-left " +
      "hover:tw-bg-secondary-100 " +
      "focus:tw-bg-secondary-100 focus:tw-z-50 focus:tw-outline-none focus:tw-ring focus:tw-ring-offset-2 focus:tw-ring-primary-700 " +
      "active:!tw-ring-0 active:!tw-ring-offset-0",
    role: "menuitem",
    tabIndex: "-1",
  },
  template: `<ng-content></ng-content>`,
})
export class MenuItemComponent implements FocusableOption {
  constructor(private elementRef: ElementRef) {}

  focus() {
    this.elementRef.nativeElement.focus();
  }
}
