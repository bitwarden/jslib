import { Component, Input, Output, EventEmitter } from "@angular/core";

type ModeTypes = "primary" | "secondary";
type ButtonTypes = "default" | "outline";
type CombiendTypes = `${ModeTypes}-${ButtonTypes}`;

@Component({
  selector: "storybook-button",
  template: ` <button type="button" (click)="onClick.emit($event)" [ngClass]="classes">
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
   * What background color to use
   */
  @Input()
  backgroundColor?: string;

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
    "primary-default": "border border-blue-500 bg-blue-500 hover:bg-blue-700 text-white",
    "primary-outline": "border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white",
    "secondary-default": "",
    "secondary-outline": "",
  };

  public get classes(): string[] {
    const style: CombiendTypes = `${this.mode}-${this.buttonType}`;
    return ["font-semibold py-2 px-4 rounded mr-2 transition", this.buttonStyles[style]];
  }
}
