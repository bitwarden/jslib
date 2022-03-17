import { Component, Output, TemplateRef, ViewChild, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';

@Component({
    selector: "bitMenu",
    templateUrl: "./menu.component.html"
})
export class MenuComponent {
    @ViewChild(TemplateRef) templateRef: TemplateRef<any>;
    @Output() closed = new Observable<void>();
}
