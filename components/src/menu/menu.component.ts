import { Component, Output, TemplateRef, ViewChild, EventEmitter } from "@angular/core";

@Component({
  selector: "bit-menu",
  templateUrl: "./menu.component.html",
})
export class MenuComponent {
  @ViewChild(TemplateRef) templateRef: TemplateRef<any>;
  @Output() closed = new EventEmitter<void>();
}
