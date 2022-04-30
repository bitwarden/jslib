import { Component, ContentChild } from "@angular/core";

import { BitInput } from "../input/input.component";

@Component({
  selector: "bit-form-field",
  templateUrl: "./form-field.component.html",
})
export class FormFieldComponent {
  @ContentChild(BitInput) input: BitInput;
}
