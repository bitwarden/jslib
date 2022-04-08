import { Component } from '@angular/core';

@Component({
    selector: "[bit-menu-item]",
    templateUrl: "./menu-item.component.html",
    host: {
        "class": "tw-py-1 tw-px-6 !tw-text-main !tw-no-underline hover:tw-bg-secondary-100 focus:tw-bg-secondary-100",
        "role": "menuitem"
    }
})
export class MenuItemComponent {
}
