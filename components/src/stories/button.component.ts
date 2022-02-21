import {
  Input,
  Output,
  EventEmitter,
  HostBinding,
  ElementRef,
  OnChanges,
  Directive,
} from "@angular/core";

type ModeTypes = "primary" | "secondary" | "danger";
type ButtonTypes = "default" | "outline";

const buttonStyles: Record<ModeTypes, Record<ButtonTypes, string>> = {
  primary: {
    default:
      "tw-border-primary-500 tw-bg-primary-500 tw-text-white hover:tw-bg-primary-700 disabled:tw-opacity-60 disabled:hover:tw-bg-primary-500",
    outline:
      "tw-bg-gray-100 tw-border-gray-400 tw-text-primary-500 hover:tw-bg-primary-500 hover:tw-border-primary-500 hover:tw-text-white",
  },
  secondary: {
    default: "",
    outline:
      "tw-border-secondary-500 !tw-text-secondary-900 hover:tw-bg-secondary-500 hover:!tw-text-[#333333]",
  },
  danger: {
    default: "",
    outline:
      "tw-bg-gray-100 tw-border-gray-400 tw-text-danger-500 hover:tw-bg-danger-500 hover:tw-border-danger-500 hover:tw-text-white",
  },
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
    return [
      "tw-font-semibold tw-py-2 tw-px-4 tw-rounded tw-transition tw-border tw-border-solid tw-text-center hover:tw-no-underline",
      this.block ? "tw-w-full tw-block" : "",
      buttonStyles?.[this.mode]?.[this.buttonType],
    ];
  }
}
