import { Importer } from '../importers/importer';
export type ImportOptions = Array<{id: string, name: string}>;
export abstract class ImportService {
    submit: (importer: Importer, fileContents: string) => Promise<Error>;
    getOptions: () => ImportOptions;
    getImporter: (format: string) => Importer;
}
