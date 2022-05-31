import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormFieldModule } from "src/form-field";

import { BitInput } from "./input.component";

@NgModule({
  imports: [CommonModule],
  exports: [BitInput, FormFieldModule],
  declarations: [BitInput],
})
export class InputModule {}
