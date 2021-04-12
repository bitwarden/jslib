import { Cipher } from '../models/domain/cipher';
import { CipherView } from '../models/view/cipherView';

import { ContainerService } from '../services/container.service';
import { CryptoService } from '../services/crypto.service';
import { MemoryStorageService } from '../services/memoryStorage.service';
import { NodeCryptoFunctionService } from '../services/nodeCryptoFunction.service';
import { WorkerLogService } from './services/workerLogService';

const thisWorker: Worker = self as any;

thisWorker.addEventListener('message', async event => {
    const decryptAllWorker = new CryptoWorker(event.data);
    await decryptAllWorker.decryptAll();
});

class CryptoWorker {
    data: any;
    encryptedCiphers: Cipher[];

    containerService: ContainerService;
    cryptoFunctionService: NodeCryptoFunctionService;
    cryptoService: CryptoService;
    logService: WorkerLogService;
    platformUtilsService: null;
    secureStorageService: MemoryStorageService;
    storageService: MemoryStorageService;

    constructor(data: any) {
        this.data = data;
        this.startServices();

        this.encryptedCiphers = JSON.parse(this.data.ciphers).map((c: any) => new Cipher(c));

        const storage = JSON.parse(data.storage);
        if (storage != null) {
            for (const prop in storage) {
                if (!storage.hasOwnProperty(prop)) {
                    continue;
                }
                this.storageService.save(prop, storage[prop]);
            }
        }

        const secureStorage = JSON.parse(data.secureStorage);
        if (secureStorage != null) {
            for (const prop in secureStorage) {
                if (!secureStorage.hasOwnProperty(prop)) {
                    continue;
                }
                this.secureStorageService.save(prop, secureStorage[prop]);
            }
        }

        // const parsedOrgKeys = JSON.parse(this.data.orgKeys);
        // let orgKeys: Map<string, SymmetricCryptoKey> = null;
        // if (parsedOrgKeys != null) {
        //     orgKeys = new Map<string, SymmetricCryptoKey>();
        //     for (const [k, v] of parsedOrgKeys) {
        //         orgKeys.set(k, new SymmetricCryptoKey(Utils.fromB64ToArray(v)));
        //     }
        // }
    }

    startServices() {
        this.cryptoFunctionService = new NodeCryptoFunctionService();
        this.logService = new WorkerLogService(false, level => true, thisWorker);
        this.platformUtilsService = null as any;
        this.secureStorageService = new MemoryStorageService();
        this.storageService = new MemoryStorageService();

        this.cryptoService = new CryptoService(this.storageService, this.secureStorageService, this.cryptoFunctionService,
            this.platformUtilsService, this.logService);

        this.containerService = new ContainerService(this.cryptoService);
        this.containerService.attachToGlobal(global);
    }

    async decryptAll() {
        this.postLogMessage('decryptAll started');
        const startTime = performance.now();

        const promises: any[] = [];
        const decryptedCiphers: CipherView[] = [];
        this.encryptedCiphers.forEach(cipher => {
            promises.push(cipher.decrypt().then(c => decryptedCiphers.push(c)));
        });
        await Promise.all(promises);

        const response = decryptedCiphers.map(c => JSON.stringify(c));

        const endTime = performance.now();
        this.postLogMessage('decryptAllWorker finished in ' + (endTime - startTime));
        this.postMessage({ type: 'data', message: response });
    }

    postMessage(message: any) {
        thisWorker.postMessage(message);
    }

    postLogMessage(message: any) {
        this.postMessage({ type: 'logMessage', message: message });
    }
}
