import { ProtectedValue } from "kdbxweb";

export abstract class ExportKdbxService {
    getExport: (password: ProtectedValue) => Promise<ArrayBuffer>;
    getOrganizationExport: (organizationId: string, format?: 'kdbx') => Promise<string>;
    getFileName: (prefix?: string) => string;
}
