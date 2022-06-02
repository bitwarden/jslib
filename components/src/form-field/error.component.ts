import { Component, HostBinding, Input } from "@angular/core";

import { I18nService } from "jslib-common/abstractions/i18n.service";

// Increments for each instance of this component
let nextId = 0;

@Component({
  selector: "bit-error",
  template: `<i class="bwi bwi-error"></i> {{ displayError }}`,
  host: {
    class: "tw-block tw-mt-1 tw-text-danger",
    "aria-live": "assertive",
  },
})
export class BitErrorComponent {
  @HostBinding() id = `bit-error-${nextId++}`;

  @Input() error: [string, any];

  constructor(private i18nService: I18nService) {}

  get displayError() {
    switch (this.error[0]) {
      case "required":
        return this.i18nService.t("inputRequired");
      case "email":
        return this.i18nService.t("inputEmail");
      default:
        // Attempt to show a custom error message.
        if (this.error[1]?.message) {
          return this.error[1]?.message;
        }

        return this.error;
    }
  }
}
