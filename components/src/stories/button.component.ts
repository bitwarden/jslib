import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostBinding,
  ElementRef,
  OnChanges,
  Directive,
} from "@angular/core";

type ModeTypes = "primary" | "secondary";
type ButtonTypes = "default" | "outline";
type CombiendTypes = `${ModeTypes}-${ButtonTypes}`;

const buttonStyles: Record<CombiendTypes, string> = {
  "primary-default":
    "tw-border-primary-500 tw-bg-primary-500 tw-text-white hover:tw-bg-primary-700 disabled:tw-opacity-60 disabled:hover:tw-bg-primary-500",
  "primary-outline":
    "tw-border-primary-500 tw-text-primary-500 hover:tw-bg-primary-500 hover:tw-text-white",
  "secondary-default": "",
  "secondary-outline":
    "tw-border-secondary-500 !tw-text-secondary-900 hover:tw-bg-secondary-500 hover:!tw-text-[#333333]",
};

@Directive({
  selector: "button[bit-button], a[bit-button]",
})
export class ButtonComponent implements OnChanges {
  @HostBinding("class") @Input("class") classList: string = "";

  @Input()
  mode: ModeTypes = "primary";

  @Input()
  buttonType: ButtonTypes = "default";

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

  constructor(elementRef: ElementRef) {}

  ngOnChanges() {
    this.classList = this.classes.join(" ");
  }

  public get classes(): string[] {
    const style: CombiendTypes = `${this.mode}-${this.buttonType}`;

    return [
      "tw-font-semibold tw-py-2 tw-px-4 tw-rounded tw-transition tw-border tw-border-solid tw-text-center hover:tw-no-underline",
      this.block ? "tw-w-full tw-block" : "",
      buttonStyles[style],
    ];
  }
}
