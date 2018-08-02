import { Importer } from '../importers/importer';
import { ISubmitResult } from '../services/import.service';

export abstract class ImportService {
    submit: (importer: Importer, fileContents: string) => Promise<ISubmitResult>;
    getImporter: (format: string) => Importer;
}
