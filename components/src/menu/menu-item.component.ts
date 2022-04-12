import { FocusableOption } from "@angular/cdk/a11y";
import { Component, ElementRef } from "@angular/core";

@Component({
  selector: "[bit-menu-item]",
  host: {
    class:
      "tw-block tw-py-1 tw-px-6 !tw-text-main !tw-no-underline hover:tw-bg-secondary-100 focus:tw-bg-secondary-100 focus:tw-z-50 tw-cursor-pointer tw-border-none tw-bg-background tw-text-left",
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
