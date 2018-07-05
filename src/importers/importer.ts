import { ImportResult } from '../models/domain/importResult';

export interface Importer {
    parse(data: string, organization?: boolean): ImportResult;
}
