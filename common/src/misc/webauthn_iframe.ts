import { I18nService } from '../abstractions/i18n.service';
import { PlatformUtilsService } from '../abstractions/platformUtils.service';

import { IFrameComponent } from './iframe_component';
import { Utils } from './utils';

export class WebAuthnIFrame extends IFrameComponent {
    constructor(win: Window, webVaultUrl: string, private webAuthnNewTab: boolean,
        private platformUtilsService: PlatformUtilsService, private i18nService: I18nService,
        successCallback: (message: string) => any, errorCallback: (message: string) => any,
        infoCallback: (message: string) => any) {
        super(win, webVaultUrl, 'webauthn-connector.html', 'webauthn_iframe', successCallback, errorCallback, infoCallback);
    }


    init(data: any): void {
        const params = this.createParams({ data: JSON.stringify(data), btnText: this.i18nService.t('webAuthnAuthenticate') }, 2);

        if (this.webAuthnNewTab) {
            // Firefox fallback which opens the webauthn page in a new tab
            params.append('locale', this.i18nService.translationLocale);
            this.platformUtilsService.launchUri(`${this.webVaultUrl}/webauthn-fallback-connector.html?${params}`);
        } else {
            super.initComponent(params);
            if (Utils.isNullOrWhitespace(this.iframe.allow)) {
                this.iframe.allow = 'publickey-credentials-get ' + new URL(this.webVaultUrl).origin;
            }
        }
    }
}
