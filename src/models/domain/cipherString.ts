import { EncryptionType } from '../../enums/encryptionType';

import { CryptoService } from '../../abstractions/crypto.service';

export class CipherString {
    encryptedString?: string;
    encryptionType?: EncryptionType;
    decryptedValue?: string;
    cipherText?: string;
    initializationVector?: string;
    mac?: string;

    constructor(encryptedStringOrType: string | EncryptionType, ct?: string, iv?: string, mac?: string) {
        if (ct != null) {
            // ct and header
            const encType = encryptedStringOrType as EncryptionType;
            this.encryptedString = encType + '.' + ct;

            // iv
            if (iv != null) {
                this.encryptedString += ('|' + iv);
            }

            // mac
            if (mac != null) {
                this.encryptedString += ('|' + mac);
            }

            this.encryptionType = encType;
            this.cipherText = ct;
            this.initializationVector = iv;
            this.mac = mac;

            return;
        }

        this.encryptedString = encryptedStringOrType as string;
        if (!this.encryptedString) {
            return;
        }

        const headerPieces = this.encryptedString.split('.');
        let encPieces: string[] = null;

        if (headerPieces.length === 2) {
            try {
                this.encryptionType = parseInt(headerPieces[0], null);
                encPieces = headerPieces[1].split('|');
            } catch (e) {
                return;
            }
        } else {
            encPieces = this.encryptedString.split('|');
            this.encryptionType = encPieces.length === 3 ? EncryptionType.AesCbc128_HmacSha256_B64 :
                EncryptionType.AesCbc256_B64;
        }

        switch (this.encryptionType) {
            case EncryptionType.AesCbc128_HmacSha256_B64:
            case EncryptionType.AesCbc256_HmacSha256_B64:
                if (encPieces.length !== 3) {
                    return;
                }

                this.initializationVector = encPieces[0];
                this.cipherText = encPieces[1];
                this.mac = encPieces[2];
                break;
            case EncryptionType.AesCbc256_B64:
                if (encPieces.length !== 2) {
                    return;
                }

                this.initializationVector = encPieces[0];
                this.cipherText = encPieces[1];
                break;
            case EncryptionType.Rsa2048_OaepSha256_B64:
            case EncryptionType.Rsa2048_OaepSha1_B64:
                if (encPieces.length !== 1) {
                    return;
                }

                this.cipherText = encPieces[0];
                break;
            default:
                return;
        }
    }

    async decrypt(orgId: string): Promise<string> {
        if (this.decryptedValue) {
            return Promise.resolve(this.decryptedValue);
        }

        let cryptoService: CryptoService;
        const containerService = (window as any).bitwardenContainerService;
        if (containerService) {
            cryptoService = containerService.getCryptoService();
        } else {
            throw new Error('window.bitwardenContainerService not initialized.');
        }

        try {
            const orgKey = await cryptoService.getOrgKey(orgId);
            this.decryptedValue = await cryptoService.decryptToUtf8(this, orgKey);
        } catch (e) {
            this.decryptedValue = '[error: cannot decrypt]';
        }
        return this.decryptedValue;
    }
}
