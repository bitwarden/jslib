import { PlatformUtilsService } from '../abstractions/platformUtils.service';

export class WebAuthn {
    private iframe: HTMLIFrameElement = null;
    private connectorLink: HTMLAnchorElement;
    private parseFunction = this.parseMessage.bind(this);

    constructor(private win: Window, private webVaultUrl: string, private platformUtilsService: PlatformUtilsService,
        private locale: string, private successCallback: Function, private errorCallback: Function,
        private infoCallback: Function) {
        this.connectorLink = win.document.createElement('a');
        this.webVaultUrl = webVaultUrl != null && webVaultUrl !== '' ? webVaultUrl : 'https://vault.bitwarden.com';
    }

    init(data: any): void {
        const params = new URLSearchParams({
            data: this.base64Encode(JSON.stringify(data)),
            parent: encodeURIComponent(this.win.document.location.href),
            v: '1',
        });

        if (this.platformUtilsService.isFirefox()) {
            // Firefox fallback which opens the webauthn page in a new tab
            params.append('locale', this.locale);
            this.platformUtilsService.launchUri(`${this.webVaultUrl}/webauthn-fallback-connector.html?${params}`);
        } else {
            this.connectorLink.href = `${this.webVaultUrl}/webauthn-connector.html?${params}`;
            this.iframe = this.win.document.getElementById('webauthn_iframe') as HTMLIFrameElement;
            this.iframe.src = this.connectorLink.href;

            this.win.addEventListener('message', this.parseFunction, false);
        }
    }

    stop() {
        this.sendMessage('stop');
    }

    start() {
        this.sendMessage('start');
    }

    sendMessage(message: any) {
        if (!this.iframe || !this.iframe.src || !this.iframe.contentWindow) {
            return;
        }

        this.iframe.contentWindow.postMessage(message, this.iframe.src);
    }

    base64Encode(str: string): string {
        return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
            return String.fromCharCode(('0x' + p1) as any);
        }));
    }

    cleanup() {
        this.win.removeEventListener('message', this.parseFunction, false);
    }

    private parseMessage(event: MessageEvent) {
        if (!this.validMessage(event)) {
            return;
        }

        const parts: string[] = event.data.split('|');
        if (parts[0] === 'success' && this.successCallback) {
            this.successCallback(parts[1]);
        } else if (parts[0] === 'error' && this.errorCallback) {
            this.errorCallback(parts[1]);
        } else if (parts[0] === 'info' && this.infoCallback) {
            this.infoCallback(parts[1]);
        }
    }

    private validMessage(event: MessageEvent) {
        if (event.origin == null || event.origin === '' || event.origin !== (this.connectorLink as any).origin ||
            event.data == null || typeof (event.data) !== 'string') {
            return false;
        }

        return event.data.indexOf('success|') === 0 || event.data.indexOf('error|') === 0 ||
            event.data.indexOf('info|') === 0;
    }
}
