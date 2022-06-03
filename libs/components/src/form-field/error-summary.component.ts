import { Component, Input } from "@angular/core";
import { AbstractControl, FormGroup } from "@angular/forms";

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
    return this.getErrorCount(this.formGroup);
  }

  get errorString() {
    return this.errorCount.toString();
  }

  private getErrorCount(form: FormGroup): number {
    return Object.values(form.controls).reduce((acc: number, control: AbstractControl) => {
      if (control instanceof FormGroup) {
        return acc + this.getErrorCount(control);
      }

      if (control.errors == null) {
        return acc;
      }

      return acc + Object.keys(control.errors).length;
    }, 0);
  }
}
