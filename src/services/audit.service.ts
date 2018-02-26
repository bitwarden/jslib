import { CryptoService } from '../abstractions/crypto.service';

export class AuditService {

    private url = 'https://api.pwnedpasswords.com/range/';

    constructor(private cryptoService: CryptoService) {
    }

    async passwordLeaked(password: string): Promise<number> {
        const hash = (await this.cryptoService.sha1(password)).toUpperCase();

        const response = await fetch(this.url + hash.substr(0, 5));
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
