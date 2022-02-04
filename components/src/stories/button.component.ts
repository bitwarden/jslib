import { Component, Input, Output, EventEmitter } from "@angular/core";

type ModeTypes = "primary" | "secondary";
type ButtonTypes = "default" | "outline";
type CombiendTypes = `${ModeTypes}-${ButtonTypes}`;

@Component({
  selector: "storybook-button",
  template: `<button type="button" (click)="onClick.emit($event)" [ngClass]="classes">
    {{ label }}
  </button>`,
})
export class ButtonComponent {
  /**
   * Is this the principal call to action on the page?
   */
  @Input()
  mode: ModeTypes = "primary";

  @Input()
  buttonType: ButtonTypes = "default";

  /**
   * How large should the button be?
   */
  @Input()
  size: "small" | "medium" | "large" = "medium";

  /**
   * Button contents
   *
   * @required
   */
  @Input()
  label = "Button";

  /**
   * Optional click handler
   */
  @Output()
  onClick = new EventEmitter<Event>();

  private buttonStyles: Record<CombiendTypes, string> = {
    "primary-default":
      "tw-border tw-border-blue-500 tw-bg-blue-500 tw-text-white hover:tw-bg-blue-700",
    "primary-outline":
      "tw-border tw-border-blue-500 tw-text-blue-500 hover:tw-bg-blue-500 hover:tw-text-white",
    "secondary-default": "",
    "secondary-outline": "",
  };

  public get classes(): string[] {
    const style: CombiendTypes = `${this.mode}-${this.buttonType}`;

    return [
      "tw-font-semibold tw-py-2 tw-px-4 tw-rounded tw-mr-2 tw-transition",
      this.buttonStyles[style] || "lol",
    ];
  }
}
