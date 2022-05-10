import { OverlayModule } from "@angular/cdk/overlay";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { MenuDividerComponent } from "./menu-divider.component";
import { MenuItemComponent } from "./menu-item.component";
import { MenuTriggerForDirective } from "./menu-trigger-for.directive";
import { MenuComponent } from "./menu.component";

@NgModule({
  imports: [CommonModule, OverlayModule],
  declarations: [MenuComponent, MenuTriggerForDirective, MenuItemComponent, MenuDividerComponent],
  exports: [MenuComponent, MenuTriggerForDirective, MenuItemComponent, MenuDividerComponent],
})
export class MenuModule {}
