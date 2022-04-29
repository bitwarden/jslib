import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { InputModule } from "../input/input.module";

import { FormFieldComponent } from "./form-field.component";
import { BitLabel } from "./label";

@NgModule({
  imports: [CommonModule, InputModule],
  exports: [FormFieldComponent, BitLabel],
  declarations: [FormFieldComponent, BitLabel],
})
export class FormFieldModule {}
