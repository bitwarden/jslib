import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { ButtonDirective } from "./button.directive";

@NgModule({
  imports: [CommonModule],
  exports: [ButtonDirective],
  declarations: [ButtonDirective],
})
export class ButtonModule {}
