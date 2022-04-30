import {
  AfterContentChecked,
  Component,
  ContentChild,
  ContentChildren,
  QueryList,
} from "@angular/core";

import { BitInput } from "../input/input.component";

import { BitPrefix } from "./prefix";
import { BitSuffix } from "./suffix";

@Component({
  selector: "bit-form-field",
  templateUrl: "./form-field.component.html",
})
export class BitFormFieldComponent implements AfterContentChecked {
  @ContentChild(BitInput) input: BitInput;
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
  }
}
