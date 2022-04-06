import { Component, Output, TemplateRef, ViewChild, EventEmitter } from '@angular/core';

@Component({
    selector: "[bit-menu-item]",
    templateUrl: "./menu-item.component.html",
    host: {
        "class": "tw-py-2 tw-px-5"
    }
})
export class MenuItemComponent {
}
