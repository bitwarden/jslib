import { ImportResult } from '../models/domain/importResult';

export interface Importer {
    organization: boolean;

    parse(data: string): ImportResult;
}
