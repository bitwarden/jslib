import { Cipher } from '../models/domain/cipher';
import { CipherView } from '../models/view/cipherView';
import { ContainerService } from '../services/container.service';
import { WorkerCryptoService } from './services/workerCryptoService';
import { WorkerLogService } from './services/workerLogService';

const thisWorker: Worker = self as any;

thisWorker.addEventListener('message', async event => {
    const decryptAllWorker = new DecryptAllWorker(event.data);
    await decryptAllWorker.decryptAll();
});

class DecryptAllWorker {
    data: any;

    constructor(data: any) {
        this.data = data;

        const logService = new WorkerLogService(this);
        const cryptoService = new WorkerCryptoService(this.data.key, logService);
        const containerService = new ContainerService(cryptoService as any);
        containerService.attachToGlobal(global);
    }

    async decryptAll() {
        thisWorker.postMessage('decryptAllWorker started');
        const startTime = performance.now();

        const encryptedCiphers: Cipher[] = this.data.ciphers.map((c: any) => new Cipher(JSON.parse(c)));

        const promises: any[] = [];
        const decryptedCiphers: CipherView[] = [];
        encryptedCiphers.forEach(cipher => {
            promises.push(cipher.decrypt().then(c => decryptedCiphers.push(c)));
        });
        await Promise.all(promises);

        const response = decryptedCiphers.map(c => JSON.stringify(c));

        const endTime = performance.now();
        this.postMessage('decryptAllWorker finished in ' + (endTime - startTime));
        this.postMessage({ ciphers: response });
    }

    postMessage(message: any) {
        thisWorker.postMessage(message);
    }
}
