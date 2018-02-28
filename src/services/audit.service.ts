import { CryptoService } from '../abstractions/crypto.service';

const PwnedPasswordsApi = 'https://api.pwnedpasswords.com/range/';

export class AuditService {
    constructor(private cryptoService: CryptoService) {
    }

    async passwordLeaked(password: string): Promise<number> {
        const hash = (await this.cryptoService.sha1(password)).toUpperCase();
        const hashStart = hash.substr(0, 5);
        const hashEnding = hash.substr(5);

        const response = await fetch(PwnedPasswordsApi + hashStart);
        const leakedHashes = await response.text();

        const match = leakedHashes.split(/\r?\n/).find((v) => {
            return v.split(':')[0] === hashEnding;
        });

        return match != null ? parseInt(match.split(':')[1], 10) : 0;
    }
}
