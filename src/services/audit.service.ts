import { CryptoService } from '../abstractions/crypto.service';

const PwnedPasswordsApi = 'https://api.pwnedpasswords.com/range/';

export class AuditService {

    constructor(private cryptoService: CryptoService) {
    }

    async passwordLeaked(password: string): Promise<number> {
        const hash = (await this.cryptoService.sha1(password)).toUpperCase();

        const response = await fetch(PwnedPasswordsApi + hash.substr(0, 5));
        const leakedHashes = await response.text();

        const hashEnding = hash.substr(5);

        const match = leakedHashes
            .split(/\r?\n/)
            .find((v) => {
                return v.split(':')[0] === hashEnding;
            });

        return match ? parseInt(match.split(':')[1], 10) : 0;
    }
}
