import { CipherView } from '../models/view/cipherView';

export abstract class SearchService {
    indexCiphers: () => Promise<void>;
    searchCiphers: (query: string) => Promise<CipherView[]>;
}
