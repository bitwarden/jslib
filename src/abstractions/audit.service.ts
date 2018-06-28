import { BreachAccountResponse } from '../models/response/breachAccountResponse';

export abstract class AuditService {
    passwordLeaked: (password: string) => Promise<number>;
    breachedAccounts: (email: string) => Promise<BreachAccountResponse[]>;
}
