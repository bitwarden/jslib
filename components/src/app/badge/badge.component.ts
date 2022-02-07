import { Component, OnInit } from "@angular/core";

@Component({
  selector: "bit-badge",
  template: ` <span [classList]="classes"><ng-content></ng-content></span> `,
})
export class BadgeComponent implements OnInit {
  constructor() {}

  ngOnInit() {}

  get classes() {
    return [
      "tw-inline-flex tw-items-center tw-justify-center tw-px-2 tw-py-1 tw-mr-2 tw-text-xs tw-font-bold tw-leading-none tw-text-white tw-bg-primary-500 tw-rounded",
    ];
  }
}
