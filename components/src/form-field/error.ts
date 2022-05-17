import { Component, Input } from "@angular/core";

import { I18nService } from "jslib-common/abstractions/i18n.service";

// Increments for each instance of the input component
let nextId = 0;

@Component({
  selector: "bit-error",
  template: `<i class="bwi bwi-error"></i> {{ displayError }}`,
  host: {
    "[attr.id]": "id",
    class: "tw-block tw-mt-1 tw-text-danger",
  },
})
export class BitError {
  @Input()
  error: [string, any];

  id = `bit-error-${nextId++}`;

  constructor(private i18nService: I18nService) {}

  get displayError() {
    switch (this.error[0]) {
      case "required":
        return this.i18nService.t("inputRequired");
      case "email":
        return this.i18nService.t("inputEmail");
      default:
        if (this.error[1]?.message) {
          return this.error[1]?.message;
        }

        return this.error;
    }
  }
}
