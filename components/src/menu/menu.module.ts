import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MenuTriggerForDirective } from './menu-trigger-for.directive';

import { MenuComponent } from "./menu.component";

@NgModule({
  imports: [CommonModule, OverlayModule],
  exports: [
    MenuComponent,
    MenuTriggerForDirective],
  declarations: [
    MenuComponent,
    MenuTriggerForDirective],
})
export class MenuModule {}
