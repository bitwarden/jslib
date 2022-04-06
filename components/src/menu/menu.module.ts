import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MenuTriggerForDirective } from './menu-trigger-for.directive';

import { MenuComponent } from "./menu.component";
import { MenuItemComponent } from "./menu-item.component";

@NgModule({
  imports: [CommonModule, OverlayModule],
  declarations: [
    MenuComponent,
    MenuTriggerForDirective,
    MenuItemComponent
  ],
  exports: [
    MenuComponent,
    MenuTriggerForDirective,
    MenuItemComponent,
  ],
})
export class MenuModule {}
