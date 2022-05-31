import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { FormFieldComponent } from "./form-field.component";
import { BitLabel } from "./label";

@NgModule({
  imports: [CommonModule],
  exports: [FormFieldComponent, BitLabel],
  declarations: [FormFieldComponent, BitLabel],
})
export class FormFieldModule {}
