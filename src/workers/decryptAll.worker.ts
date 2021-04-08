import { Cipher } from '../models/domain/cipher';
import { CipherView } from '../models/view/cipherView';
import { ContainerService } from '../services/container.service';
import { WorkerCryptoService } from './workerCryptoService';
import { WorkerLogService } from './workerLogService';

const worker: Worker = self as any;

worker.addEventListener('message', async event => {
    worker.postMessage('decryptAllWorker started');
    const startTime = performance.now();

    const logService = new WorkerLogService(worker);
    const cryptoService = new WorkerCryptoService(event.data.key, logService);
    const containerService = new ContainerService(cryptoService as any);
    containerService.attachToGlobal(global);

    const encryptedCiphers: Cipher[] = event.data.ciphers.map((c: any) => new Cipher(JSON.parse(c)));

    const promises: any[] = [];
    const decryptedCiphers: CipherView[] = [];
    encryptedCiphers.forEach(cipher => {
        promises.push(cipher.decrypt().then(c => decryptedCiphers.push(c)));
    });
    await Promise.all(promises);

    const response = decryptedCiphers.map(c => CipherView.serialize(c));

    const endTime = performance.now();
    worker.postMessage('decryptAllWorker finished in ' + (endTime - startTime));
    worker.postMessage({ ciphers: response });
});
