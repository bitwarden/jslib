import { Component, ContentChild, ContentChildren, OnInit, QueryList } from "@angular/core";

import { FormFieldControl } from "./form-field-control";
import { BitHint } from "./hint";
import { BitLabel } from "./label";
import { BitSuffix } from "./suffix";

@Component({
  selector: "bit-form-field",
  templateUrl: "form-field.component.html",
})
export class FormFieldComponent implements OnInit {
  // @ViewChild("inputContainer") _inputContainerRef: ElementRef;
  // @ViewChild("bit-label") private _label: ElementRef<HTMLElement>;

  @ContentChild(BitLabel) label: BitLabel;
  @ContentChildren(BitHint, { descendants: true }) hintChildren: QueryList<BitHint>;
  @ContentChildren(BitSuffix, { descendants: true }) suffixChildren: QueryList<BitSuffix>;
  @ContentChild(FormFieldControl) _inputNonStatic: FormFieldControl<any>;
  @ContentChild(FormFieldControl, { static: true }) _inputStatic: FormFieldControl<any>;
  get input() {
    return this._inputExplicit || this._inputNonStatic || this._inputStatic;
  }
  set input(value: FormFieldControl<any>) {
    this._inputExplicit = value;
  }
  private _inputExplicit: FormFieldControl<any>;

  ngOnInit(): void {
    return;
  }

  get displayedMessage(): "error" | "desc" {
    return "desc";
  }
}
