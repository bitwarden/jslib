import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { TabGroupComponent } from "./tab-group.component";
import { TabItemComponent } from "./tab-item.component";

@NgModule({
  imports: [CommonModule],
  exports: [TabGroupComponent, TabItemComponent],
  declarations: [TabGroupComponent, TabItemComponent],
})
export class TabsModule {}
