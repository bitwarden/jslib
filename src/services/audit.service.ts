import { AuditService as AuditServiceAbstraction } from '../abstractions/audit.service';
import { CryptoFunctionService } from '../abstractions/cryptoFunction.service';
import { Utils } from '../misc/utils';

const PwnedPasswordsApi = 'https://api.pwnedpasswords.com/range/';

export class AuditService implements AuditServiceAbstraction {
    constructor(private cryptoFunctionService: CryptoFunctionService) { }

    async passwordLeaked(password: string): Promise<number> {
        const hashBytes = await this.cryptoFunctionService.hash(password, 'sha1');
        const hash = Utils.fromBufferToHex(hashBytes).toUpperCase();
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
