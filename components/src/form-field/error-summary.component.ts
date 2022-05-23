import { Component, Input } from "@angular/core";
import { FormGroup } from "@angular/forms";

@Component({
  selector: "bit-error-summary",
  template: ` <ng-container *ngIf="errorCount > 0">
    <i class="bwi bwi-error"></i> {{ "fieldsNeedAttention" | i18n: errorString }}
  </ng-container>`,
  host: {
    class: "tw-block tw-text-danger tw-mt-2",
    "aria-live": "assertive",
  },
})
export class BitErrorSummary {
  @Input()
  formGroup: FormGroup;

  get errorCount(): number {
    const errors = Object.values(this.formGroup.controls).filter((e) => e.touched && !e.valid);

    return errors.length;
  }

  get errorString() {
    return this.errorCount.toString();
  }
}
