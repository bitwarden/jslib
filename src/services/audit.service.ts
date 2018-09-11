import { ApiService } from '../abstractions/api.service';
import { AuditService as AuditServiceAbstraction } from '../abstractions/audit.service';
import { CryptoFunctionService } from '../abstractions/cryptoFunction.service';

import { Utils } from '../misc/utils';

import { BreachAccountResponse } from '../models/response/breachAccountResponse';

const PwnedPasswordsApi = 'https://api.pwnedpasswords.com/range/';
const HibpBreachApi = 'https://haveibeenpwned.com/api/v2/breachedaccount/';

export class AuditService implements AuditServiceAbstraction {
    constructor(private cryptoFunctionService: CryptoFunctionService, private apiService: ApiService) { }

    async passwordLeaked(password: string): Promise<number> {
        const hashBytes = await this.cryptoFunctionService.hash(password, 'sha1');
        const hash = Utils.fromBufferToHex(hashBytes).toUpperCase();
        const hashStart = hash.substr(0, 5);
        const hashEnding = hash.substr(5);

        const response = await fetch(new Request(PwnedPasswordsApi + hashStart));
        const leakedHashes = await response.text();
        const match = leakedHashes.split(/\r?\n/).find((v) => {
            return v.split(':')[0] === hashEnding;
        });

        return match != null ? parseInt(match.split(':')[1], 10) : 0;
    }

    async breachedAccounts(username: string): Promise<BreachAccountResponse[]> {
        const response = await fetch(new Request(HibpBreachApi + username));
        if (response.status === 404) {
            return [];
        } else if (response.status !== 200) {
            throw new Error();
        }
        const responseJson = await response.json();
        return responseJson.map((a: any) => new BreachAccountResponse(a));
    }
}
