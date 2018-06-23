import { ImportResult } from '../models/domain/importResult';

export interface Importer {
    import(data: string): ImportResult;
}
