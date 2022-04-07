import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MenuTriggerForDirective } from './menu-trigger-for.directive';

import { MenuComponent } from "./menu.component";
import { MenuItemComponent } from "./menu-item.component";
import { MenuDividerComponent } from "./menu-divider.component";

@NgModule({
  imports: [CommonModule, OverlayModule],
  declarations: [
    MenuComponent,
    MenuTriggerForDirective,
    MenuItemComponent,
    MenuDividerComponent
  ],
  exports: [
    MenuComponent,
    MenuTriggerForDirective,
    MenuItemComponent,
    MenuDividerComponent
  ],
})
export class MenuModule {}
