// tslint:disable-next-line
const nodeURL = typeof window === 'undefined' ? require('url').URL : null;

export class Utils {
    static inited = false;
    static isNode = false;
    static isBrowser = true;
    static global: NodeJS.Global | Window = null;

    static init() {
        if (Utils.inited) {
            return;
        }

        Utils.inited = true;
        Utils.isNode = typeof process !== 'undefined' && (process as any).release != null &&
            (process as any).release.name === 'node';
        Utils.isBrowser = typeof window !== 'undefined';
        Utils.global = Utils.isNode && !Utils.isBrowser ? global : window;
    }

    static fromB64ToArray(str: string): Uint8Array {
        if (Utils.isNode) {
            return new Uint8Array(Buffer.from(str, 'base64'));
        } else {
            const binaryString = window.atob(str);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            return bytes;
        }
    }

    static fromHexToArray(str: string): Uint8Array {
        if (Utils.isNode) {
            return new Uint8Array(Buffer.from(str, 'hex'));
        } else {
            const bytes = new Uint8Array(str.length / 2);
            for (let i = 0; i < str.length; i += 2) {
                bytes[i / 2] = parseInt(str.substr(i, 2), 16);
            }
            return bytes;
        }
    }

    static fromUtf8ToArray(str: string): Uint8Array {
        if (Utils.isNode) {
            return new Uint8Array(Buffer.from(str, 'utf8'));
        } else {
            const strUtf8 = unescape(encodeURIComponent(str));
            const arr = new Uint8Array(strUtf8.length);
            for (let i = 0; i < strUtf8.length; i++) {
                arr[i] = strUtf8.charCodeAt(i);
            }
            return arr;
        }
    }

    static fromByteStringToArray(str: string): Uint8Array {
        const arr = new Uint8Array(str.length);
        for (let i = 0; i < str.length; i++) {
            arr[i] = str.charCodeAt(i);
        }
        return arr;
    }

    static fromBufferToB64(buffer: ArrayBuffer): string {
        if (Utils.isNode) {
            return new Buffer(buffer).toString('base64');
        } else {
            let binary = '';
            const bytes = new Uint8Array(buffer);
            for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            return window.btoa(binary);
        }
    }

    static fromBufferToUtf8(buffer: ArrayBuffer): string {
        if (Utils.isNode) {
            return new Buffer(buffer).toString('utf8');
        } else {
            const bytes = new Uint8Array(buffer);
            const encodedString = String.fromCharCode.apply(null, bytes);
            return decodeURIComponent(escape(encodedString));
        }
    }

    static fromBufferToByteString(buffer: ArrayBuffer): string {
        return String.fromCharCode.apply(null, new Uint8Array(buffer));
    }

    // ref: https://stackoverflow.com/a/40031979/1090359
    static fromBufferToHex(buffer: ArrayBuffer): string {
        if (Utils.isNode) {
            return new Buffer(buffer).toString('hex');
        } else {
            const bytes = new Uint8Array(buffer);
            return Array.prototype.map.call(bytes, (x: number) => ('00' + x.toString(16)).slice(-2)).join('');
        }
    }

    static fromUrlB64ToUtf8(b64Str: string): string {
        let output = b64Str.replace(/-/g, '+').replace(/_/g, '/');
        switch (output.length % 4) {
            case 0:
                break;
            case 2:
                output += '==';
                break;
            case 3:
                output += '=';
                break;
            default:
                throw new Error('Illegal base64url string!');
        }

        return Utils.fromB64ToUtf8(output);
    }

    static fromB64ToUtf8(b64Str: string): string {
        if (Utils.isNode) {
            return new Buffer(b64Str, 'base64').toString('utf8');
        } else {
            return decodeURIComponent(escape(window.atob(b64Str)));
        }
    }

    // ref: http://stackoverflow.com/a/2117523/1090359
    static newGuid(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            // tslint:disable-next-line
            const r = Math.random() * 16 | 0;
            // tslint:disable-next-line
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    static getHostname(uriString: string): string {
        const url = Utils.getUrl(uriString);
        return url != null ? url.hostname : null;
    }

    static getHost(uriString: string): string {
        const url = Utils.getUrl(uriString);
        return url != null ? url.host : null;
    }

    private static getUrl(uriString: string): URL {
        if (uriString == null) {
            return null;
        }

        uriString = uriString.trim();
        if (uriString === '') {
            return null;
        }

        if (uriString.indexOf('://') === -1 && uriString.indexOf('.') > -1) {
            uriString = 'http://' + uriString;
        }

        if (uriString.startsWith('http://') || uriString.startsWith('https://')) {
            try {
                if (nodeURL != null) {
                    return new nodeURL(uriString);
                } else if (typeof URL === 'function') {
                    return new URL(uriString);
                } else if (window != null) {
                    const anchor = window.document.createElement('a');
                    anchor.href = uriString;
                    return anchor as any;
                }
            } catch (e) { }
        }

        return null;
    }
}

Utils.init();
