import { FocusableOption } from "@angular/cdk/a11y";
import { Directive, ElementRef, HostBinding } from "@angular/core";

@Directive({
  selector: "[bitMenuItem]",
})
export class MenuItemDirective implements FocusableOption {
  @HostBinding("class") classList = [
    "tw-block",
    "tw-py-1",
    "tw-px-4",
    "!tw-text-main",
    "!tw-no-underline",
    "tw-cursor-pointer",
    "tw-border-none",
    "tw-bg-background",
    "tw-text-left",
    "hover:tw-bg-secondary-100",
    "focus:tw-bg-secondary-100",
    "focus:tw-z-50",
    "focus:tw-outline-none",
    "focus:tw-ring",
    "focus:tw-ring-offset-2",
    "focus:tw-ring-primary-700",
    "active:!tw-ring-0",
    "active:!tw-ring-offset-0",
  ];
  @HostBinding("attr.role") role = "menuitem";
  @HostBinding("tabIndex") tabIndex = "-1";

  constructor(private elementRef: ElementRef) {}

  focus() {
    this.elementRef.nativeElement.focus();
  }
}
