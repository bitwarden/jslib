import { CommonModule } from "@angular/common";
import { NgModule, Pipe, PipeTransform } from "@angular/core";

import { I18nService } from "jslib-common/abstractions/i18n.service";

import { BitInput } from "../input/input.component";
import { InputModule } from "../input/input.module";

import { BitErrorSummary } from "./error-summary.component";
import { BitError } from "./error.component";
import { BitFormFieldComponent } from "./form-field.component";
import { BitHintComponent } from "./hint.component";
import { BitLabel } from "./label.directive";
import { BitPrefix } from "./prefix.directive";
import { BitSuffix } from "./suffix.directive";

/**
 * Temporarily duplicate this pipe
 */
@Pipe({
  name: "i18n",
})
export class I18nPipe implements PipeTransform {
  constructor(private i18nService: I18nService) {}

  transform(id: string, p1?: string, p2?: string, p3?: string): string {
    return this.i18nService.t(id, p1, p2, p3);
  }
}

@NgModule({
  imports: [CommonModule, InputModule],
  exports: [
    BitError,
    BitErrorSummary,
    BitFormFieldComponent,
    BitHintComponent,
    BitInput,
    BitLabel,
    BitPrefix,
    BitSuffix,
  ],
  declarations: [
    BitError,
    BitErrorSummary,
    BitFormFieldComponent,
    BitHintComponent,
    BitLabel,
    BitPrefix,
    BitSuffix,
    I18nPipe,
  ],
})
export class FormFieldModule {}
