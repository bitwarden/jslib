import { Component, Input, OnInit } from "@angular/core";

import { I18nService } from "jslib-common/abstractions/i18n.service";

type CalloutTypes = "success" | "info" | "warning" | "danger" | "error" | "tip";

@Component({
  selector: "bit-callout",
  templateUrl: "callout.component.html",
})
export class CalloutComponent implements OnInit {
  @Input() type: CalloutTypes = "info";
  @Input() icon: string;
  @Input() title: string;
  @Input() useAlertRole = false;

  constructor(private i18nService: I18nService) {}

  ngOnInit() {
    if (this.type === "warning" || this.type === "danger") {
      if (this.title === undefined) {
        this.title = this.i18nService.t("warning");
      }
      if (this.icon === undefined) {
        this.icon = "bwi-exclamation-triangle";
      }
    } else if (this.type === "error") {
      if (this.title === undefined) {
        this.title = this.i18nService.t("error");
      }
      if (this.icon === undefined) {
        this.icon = "bwi-error";
      }
    } else if (this.type === "tip") {
      if (this.title === undefined) {
        this.title = this.i18nService.t("tip");
      }
      if (this.icon === undefined) {
        this.icon = "bwi-lightbulb";
      }
    }
  }

  get calloutClass() {
    switch (this.type) {
      case "danger":
      case "error":
        return "tw-border-l-danger-500";
      case "info":
      case "tip":
        return "tw-border-l-info-500";
      case "success":
        return "tw-border-l-success-500";
      case "warning":
        return "tw-border-l-warning-500";
    }
  }

  get headerClass() {
    switch (this.type) {
      case "danger":
      case "error":
        return "!tw-text-danger";
      case "info":
      case "tip":
        return "!tw-text-info";
      case "success":
        return "!tw-text-success";
      case "warning":
        return "!tw-text-warning";
    }
  }
}
