import { Directive } from '@angular/core';
import { I18nService } from 'jslib-common/abstractions/i18n.service';

import { PlatformUtilsService } from 'jslib-common/abstractions/platformUtils.service';
import { StateService } from 'jslib-common/abstractions/state.service';

@Directive()
export abstract class BugReportComponent {
  message: string = "";
  hasAttachedDebugInfo: boolean = false;

  constructor(protected platformUtilsService: PlatformUtilsService,
    protected i18nService: I18nService,
    protected stateService: StateService) { }

  async attachDebugInfo() {
    this.hasAttachedDebugInfo = true;
    var debugInfo: Map<string, string> = new Map<string, string>();
    debugInfo.set("Version", await this.platformUtilsService.getApplicationVersion());
    debugInfo.set("Theme", await this.platformUtilsService.getEffectiveTheme());
    debugInfo.set("Premium", (await this.stateService.getCanAccessPremium()).toString());
    debugInfo.set("Timeout", (await this.stateService.getVaultTimeout()).toString());
    debugInfo.set("Timeout Action", await this.stateService.getVaultTimeoutAction());

    this.enrich(debugInfo);

    this.message += "\n\n";
    debugInfo.forEach((value, key) => {
      this.message += `${key}: ${value}\n`;
    });
  }

  async submit() {
    if (!this.hasAttachedDebugInfo) {
      // Request them to attach debug info and cancel so they have a chance to remove some data
      const result = await this.platformUtilsService.showDialog(
        this.i18nService.t("attachDebugInfo"),
        null,
        this.i18nService.t("yes"),
        this.i18nService.t("no")
      );

      if (result) {
        await this.attachDebugInfo();
        return;
      }
    }

    // Send the message to the server
    await this.onSuccessfulSubmit();
  }

  enrich(debugInfo: Map<string, string>): Promise<void> {
    return Promise.resolve();
  }

  abstract onSuccessfulSubmit(): Promise<void>;
}
