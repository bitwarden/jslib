import { Importer } from '../importers/importer';

export interface ImportOption {
    id: string;
    name: string;
}
export abstract class ImportService {
    featuredImportOptions: ImportOption[];
    regularImportOptions: ImportOption[];
    getImportOptions: () => ImportOption[];
    import: (importer: Importer, fileContents: string, organizationId?: string) => Promise<Error>;
    getImporter: (format: string, organization?: boolean) => Importer;
}
