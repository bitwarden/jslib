import { Component, Input } from "@angular/core";

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
  error: string;

  id = `bit-error-${nextId++}`;

  get displayError() {
    switch (this.error) {
      case "required":
        return "Input is required.";
      case "email":
        return "Input is not an email-address.";
      default:
        return this.error;
    }
  }
}
