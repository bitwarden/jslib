import { CipherData } from '../models/data/cipherData';
import { CipherView } from '../models/view/cipherView';

export abstract class CryptoWorkerService {
    decryptCiphers: (cipherData: CipherData[]) => Promise<CipherView[]>;
    terminateAll: () => Promise<void[]>;
}
