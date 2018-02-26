export interface AuditService {
    passwordLeaked(password: string): Promise<number>;
}
