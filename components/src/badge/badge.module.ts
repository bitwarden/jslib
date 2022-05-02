import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { BadgeDirective } from "./badge.directive";

@NgModule({
  imports: [CommonModule],
  exports: [BadgeDirective],
  declarations: [BadgeDirective],
})
export class BadgeModule {}
