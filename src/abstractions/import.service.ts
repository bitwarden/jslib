import { Importer } from '../importers/importer';

export interface ImportOption {
    id: string;
    name: string;
}
export abstract class ImportService {
    importOptions: ImportOption[];
    import: (importer: Importer, fileContents: string) => Promise<any>;
    getImporter: (format: string) => Importer;
}
