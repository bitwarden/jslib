import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { BitInputDirective } from "./input.directive";

@NgModule({
  imports: [CommonModule],
  declarations: [BitInputDirective],
  exports: [BitInputDirective],
})
export class InputModule {}
