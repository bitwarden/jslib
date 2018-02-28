export abstract class AuditService {
    passwordLeaked: (password: string) => Promise<number>;
}
