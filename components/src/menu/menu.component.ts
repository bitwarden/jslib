import { FocusKeyManager } from "@angular/cdk/a11y";
import {
  Component,
  Output,
  TemplateRef,
  ViewChild,
  EventEmitter,
  ContentChildren,
  QueryList,
  AfterContentInit,
} from "@angular/core";

import { MenuItemComponent } from "./menu-item.component";

@Component({
  selector: "bit-menu",
  templateUrl: "./menu.component.html",
  exportAs: "menuComponent",
})
export class MenuComponent implements AfterContentInit {
  @ViewChild(TemplateRef) templateRef: TemplateRef<any>;
  @Output() closed = new EventEmitter<void>();
  @ContentChildren(MenuItemComponent, { descendants: true })
  menuItems: QueryList<MenuItemComponent>;
  keyManager: FocusKeyManager<MenuItemComponent>;

  ngAfterContentInit() {
    this.keyManager = new FocusKeyManager(this.menuItems).withWrap();
  }
}
