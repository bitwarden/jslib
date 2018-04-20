export class Utils {
    static inited = false;
    static isNode = false;
    static isBrowser = true;

    static init() {
        if (Utils.inited) {
            return;
        }

        Utils.inited = true;
        Utils.isNode = typeof window === 'undefined';
        Utils.isBrowser = !Utils.isNode;
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

    // ref: https://stackoverflow.com/a/40031979/1090359
    static fromBufferToHex(buffer: ArrayBuffer): string {
        if (Utils.isNode) {
            return new Buffer(buffer).toString('hex');
        } else {
            const bytes = new Uint8Array(buffer);
            return Array.prototype.map.call(bytes, (x: number) => ('00' + x.toString(16)).slice(-2)).join('');
        }
    }
}

Utils.init();
