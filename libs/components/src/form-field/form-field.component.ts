import {
  AfterContentChecked,
  Component,
  ContentChild,
  ContentChildren,
  QueryList,
  ViewChild,
} from "@angular/core";

import { BitInputDirective } from "../input/input.directive";

import { BitErrorComponent } from "./error.component";
import { BitHintComponent } from "./hint.component";
import { BitPrefixDirective } from "./prefix.directive";
import { BitSuffixDirective } from "./suffix.directive";

@Component({
  selector: "bit-form-field",
  templateUrl: "./form-field.component.html",
  host: {
    class: "tw-mb-6 tw-block",
  },
})
export class BitFormFieldComponent implements AfterContentChecked {
  @ContentChild(BitInputDirective) input: BitInputDirective;
  @ContentChild(BitHintComponent) hint: BitHintComponent;

  @ViewChild(BitErrorComponent) error: BitErrorComponent;

  @ContentChildren(BitPrefixDirective) prefixChildren: QueryList<BitPrefixDirective>;
  @ContentChildren(BitSuffixDirective) suffixChildren: QueryList<BitSuffixDirective>;

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
    } else if (this.hint) {
      this.input.ariaDescribedBy = this.hint.id;
    } else {
      this.input.ariaDescribedBy = undefined;
    }
  }
}
