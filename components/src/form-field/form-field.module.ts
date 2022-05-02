import { CommonModule } from "@angular/common";
import { NgModule, Pipe, PipeTransform } from "@angular/core";

import { I18nService } from "jslib-common/abstractions/i18n.service";

import { InputModule } from "../input/input.module";

import { BitFormFieldComponent } from "./form-field.component";
import { BitHintComponent } from "./hint.component";
import { BitLabel } from "./label";
import { BitPrefix } from "./prefix";
import { BitSuffix } from "./suffix";

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
    //
    BitFormFieldComponent,
    BitHintComponent,
    BitLabel,
    BitPrefix,
    BitSuffix,
  ],
  declarations: [
    //
    BitFormFieldComponent,
    BitHintComponent,
    BitLabel,
    BitPrefix,
    BitSuffix,
    I18nPipe,
  ],
})
export class FormFieldModule {}
