export abstract class ExportService {
    getExport: (format?: 'csv' | 'json') => Promise<string>;
    getOrganizationExport: (organizationId: string, format?: 'csv' | 'json') => Promise<string>;
    getFileName: (prefix?: string, extension?: string) => string;
}
