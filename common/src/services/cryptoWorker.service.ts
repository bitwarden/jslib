import { CryptoService } from '../abstractions/crypto.service';
import { CryptoWorkerService as CryptoWorkerServiceAbstraction } from '../abstractions/cryptoWorker.service';
import { StateService } from '../abstractions/state.service';
import { CipherData } from '../models/data/cipherData';
import { Cipher } from '../models/domain/cipher';
import { CipherView } from '../models/view/cipherView';

interface EncryptionKeys {
    key: string,
    encKey: string,
    orgKeys: string,
    privateKey: string
}

export class CryptoWorkerService implements CryptoWorkerServiceAbstraction {
    private currentWorkers: Worker[] = [];

    constructor(
        private cryptoService: CryptoService,
        private stateService: StateService,
    ) { }

    // Callers should be sequentialized to prevent duplicate concurrent calls
    // Consider whether we should utilize existing workers instead of creating new ones
    async decryptCiphers(cipherData: CipherData[]): Promise<CipherView[]> {
        if (cipherData == null || cipherData.length === 0) {
            return null;
        }

        const key = (await this.cryptoService.getKey()).keyB64;
        const encKey = (await this.stateService.getEncryptedCryptoSymmetricKey());
        const orgKeys = (await this.stateService.getEncryptedOrganizationKeys());
        const privateKey = (await this.stateService.getEncryptedPrivateKey());
        const encryptionKeys: EncryptionKeys = {
            key: key,
            encKey: encKey,
            orgKeys: orgKeys,
            privateKey: privateKey
        }

        const message = {
            command: 'decryptCiphers',
            ciphers: JSON.stringify(cipherData),
            keys: JSON.stringify(encryptionKeys),
        }

        return new Promise((resolve, reject) => {
            const worker = this.createWorker();

            worker.addEventListener('message', response => {
                this.terminate(worker);
                resolve(this.processDecryptedCiphers(response))
            });

            worker.postMessage(message);
        })
    }

    private async processDecryptedCiphers(response: any): Promise<CipherView[]> {
        // TODO: transform from serialized data to CipherViews
        return null;
    }

    private createWorker() {
        const worker = new Worker(new URL('../workers/crypto.worker.ts', import.meta.url));
        this.currentWorkers.push(worker);
        return worker;
    }

    terminateAll(): Promise<void[]> {
        if (this.currentWorkers.length === 0) {
            return;
        }

        const terminateResponses = this.currentWorkers.map((worker: Worker) => this.terminate(worker));
        return Promise.all(terminateResponses);
    }

    private terminate(worker: Worker) {
        return new Promise<void>((resolve, reject) => {
            const killWorker = () => {
                worker.terminate();
                const index = this.currentWorkers.indexOf(worker);
                if (index > -1) {
                    this.currentWorkers.splice(index);
                }
                clearTimeout(terminateWorkerTimeout);
                resolve();
            }

            worker.addEventListener('message', event => {
                if (event.data.command === 'clearCacheResponse') {
                    killWorker();
                }
            });

            worker.postMessage({
                command: 'clearCacheRequest',
            });

            const terminateWorkerTimeout = setTimeout(() => {
                killWorker();
            }, 250);
        });
    }
}
