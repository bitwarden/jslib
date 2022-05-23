import {
  AfterContentChecked,
  Component,
  ContentChild,
  ContentChildren,
  QueryList,
  ViewChild,
} from "@angular/core";

import { BitInput } from "../input/input.component";

import { BitError } from "./error.component";
import { BitPrefix } from "./prefix.directive";
import { BitSuffix } from "./suffix.directive";

@Component({
  selector: "bit-form-field",
  templateUrl: "./form-field.component.html",
  host: {
    class: "tw-mb-6 tw-block",
  },
})
export class BitFormFieldComponent implements AfterContentChecked {
  @ContentChild(BitInput) input: BitInput;
  @ViewChild(BitError) error: BitError;
  @ContentChildren(BitPrefix) prefixChildren: QueryList<BitPrefix>;
  @ContentChildren(BitSuffix) suffixChildren: QueryList<BitSuffix>;

  ngAfterContentChecked(): void {
    this.input.hasPrefix = this.prefixChildren.length > 0;
    this.input.hasSuffix = this.suffixChildren.length > 0;

    this.prefixChildren.forEach((prefix) => {
      prefix.first = prefix == this.prefixChildren.first;
    });

    this.suffixChildren.forEach((suffix) => {
      suffix.last = suffix == this.suffixChildren.last;
    });

    if (this.error) {
      this.input.ariaDescribedBy = this.error.id;
    } else {
      this.input.ariaDescribedBy = undefined;
    }
  }
}
