import { ConstantsService } from './constants.service';

import { CryptoFunctionService } from '../abstractions/cryptoFunction.service';
import { StorageService } from '../abstractions/storage.service';
import { TotpService as TotpServiceAbstraction } from '../abstractions/totp.service';

import { Utils } from '../misc/utils';

const b32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export class TotpService implements TotpServiceAbstraction {
    constructor(private storageService: StorageService, private cryptoFunctionService: CryptoFunctionService) { }

    async getCode(key: string): Promise<string> {
        let period = 30;
        let alg: 'sha1' | 'sha256' | 'sha512' = 'sha1';
        let digits = 6;
        let keyB32 = key;
        if (key.indexOf('otpauth://') === 0) {
            const params = Utils.getQueryParams(key);
            if (params.has('digits') && params.get('digits') != null) {
                try {
                    const digitParams = parseInt(params.get('digits').trim(), null);
                    if (digitParams > 10) {
                        digits = 10;
                    } else if (digitParams > 0) {
                        digits = digitParams;
                    }
                } catch { }
            }
            if (params.has('period') && params.get('period') != null) {
                try {
                    const periodParam = parseInt(params.get('period').trim(), null);
                    if (periodParam > 0) {
                        period = periodParam;
                    }
                } catch { }
            }
            if (params.has('secret') && params.get('secret') != null) {
                keyB32 = params.get('secret');
            }
            if (params.has('algorithm') && params.get('algorithm') != null) {
                const algParam = params.get('algorithm').toLowerCase();
                if (algParam === 'sha1' || algParam === 'sha256' || algParam === 'sha512') {
                    alg = algParam;
                }
            }
        }

        const epoch = Math.round(new Date().getTime() / 1000.0);
        const timeHex = this.leftpad(this.dec2hex(Math.floor(epoch / period)), 16, '0');
        const timeBytes = Utils.fromHexToArray(timeHex);
        const keyBytes = this.b32tobytes(keyB32);

        if (!keyBytes.length || !timeBytes.length) {
            return null;
        }

        const hash = await this.sign(keyBytes, timeBytes, alg);
        if (hash.length === 0) {
            return null;
        }

        /* tslint:disable */
        const offset = (hash[hash.length - 1] & 0xf);
        const binary = ((hash[offset] & 0x7f) << 24) | ((hash[offset + 1] & 0xff) << 16) |
            ((hash[offset + 2] & 0xff) << 8) | (hash[offset + 3] & 0xff);
        /* tslint:enable */
        let otp = (binary % Math.pow(10, digits)).toString();
        otp = this.leftpad(otp, digits, '0');
        return otp;
    }

    getTimeInterval(key: string): number {
        let period = 30;
        if (key.indexOf('otpauth://') === 0) {
            const params = Utils.getQueryParams(key);
            if (params.has('period') && params.get('period') != null) {
                try {
                    period = parseInt(params.get('period').trim(), null);
                } catch { }
            }
        }
        return period;
    }

    async isAutoCopyEnabled(): Promise<boolean> {
        return !(await this.storageService.get<boolean>(ConstantsService.disableAutoTotpCopyKey));
    }

    // Helpers

    private leftpad(s: string, l: number, p: string): string {
        if (l + 1 >= s.length) {
            s = Array(l + 1 - s.length).join(p) + s;
        }
        return s;
    }

    private dec2hex(d: number): string {
        return (d < 15.5 ? '0' : '') + Math.round(d).toString(16);
    }

    private b32tohex(s: string): string {
        s = s.toUpperCase();
        let cleanedInput = '';

        for (let i = 0; i < s.length; i++) {
            if (b32Chars.indexOf(s[i]) < 0) {
                continue;
            }

            cleanedInput += s[i];
        }
        s = cleanedInput;

        let bits = '';
        let hex = '';
        for (let i = 0; i < s.length; i++) {
            const byteIndex = b32Chars.indexOf(s.charAt(i));
            if (byteIndex < 0) {
                continue;
            }
            bits += this.leftpad(byteIndex.toString(2), 5, '0');
        }
        for (let i = 0; i + 4 <= bits.length; i += 4) {
            const chunk = bits.substr(i, 4);
            hex = hex + parseInt(chunk, 2).toString(16);
        }
        return hex;
    }

    private b32tobytes(s: string): Uint8Array {
        return Utils.fromHexToArray(this.b32tohex(s));
    }

    private async sign(keyBytes: Uint8Array, timeBytes: Uint8Array, alg: 'sha1' | 'sha256' | 'sha512') {
        const signature = await this.cryptoFunctionService.hmac(timeBytes.buffer, keyBytes.buffer, alg);
        return new Uint8Array(signature);
    }
}
