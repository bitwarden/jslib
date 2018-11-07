import { BreachAccountResponse } from '../models/response/breachAccountResponse';

export abstract class AuditService {
    clearCache: () => void;
    passwordLeaked: (password: string) => Promise<number>;
    breachedAccounts: (username: string) => Promise<BreachAccountResponse[]>;
}
