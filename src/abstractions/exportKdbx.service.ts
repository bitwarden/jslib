export abstract class ExportKdbxService {
    getExport: (format?: 'kdbx') => Promise<ArrayBuffer>;
    getOrganizationExport: (organizationId: string, format?: 'kdbx') => Promise<string>;
    getFileName: (prefix?: string) => string;
}
