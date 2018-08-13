import { CipherView } from '../models/view/cipherView';

export abstract class SearchService {
    clearIndex: () => void;
    indexCiphers: () => Promise<void>;
    searchCiphers: (query: string, filter?: (cipher: CipherView) => boolean) => Promise<CipherView[]>;
}
