import { CipherView } from '../models/view/cipherView';
import { SendView } from '../models/view/sendView';

export abstract class SearchService {
    clearIndex: () => void;
    isSearchable: (query: string) => boolean;
    indexCiphers: (ciphersToIndex?: CipherView[]) => Promise<void>;
    searchCiphers: (query: string,
        filter?: ((cipher: CipherView) => boolean) | (((cipher: CipherView) => boolean)[]),
        ciphers?: CipherView[]) => Promise<CipherView[]>;
    searchCiphersBasic: (ciphers: CipherView[], query: string, deleted?: boolean) => CipherView[];
    searchSends: (sends: SendView[], query: string) => SendView[];
}
