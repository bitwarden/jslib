import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { BitInput } from "./input.component";

@NgModule({
  imports: [CommonModule],
  declarations: [BitInput],
  exports: [BitInput],
})
export class InputModule {}
