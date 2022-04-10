import { FocusableOption } from '@angular/cdk/a11y';
import { Component, ElementRef } from "@angular/core";

const styles = [
  "tw-block",
  "tw-py-1",
  "tw-px-6",
  "!tw-text-main",
  "!tw-no-underline",
  "hover:tw-bg-secondary-100",
  "focus:tw-bg-secondary-100",
  "tw-cursor-pointer",
  "tw-border-none",
  "tw-bg-background",
  "tw-text-left"
].join(" ");

@Component({
  selector: "[bit-menu-item]",
  templateUrl: "./menu-item.component.html",
  host: {
    class: styles,
    role: "menuitem",
  },
})
export class MenuItemComponent implements FocusableOption {
  constructor(private elementRef: ElementRef) {}

  focus() {
    this.elementRef.nativeElement.focus();
  }
}
