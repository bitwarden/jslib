import { WebWorkerService as WebWorkerServiceAbstraction } from '../abstractions/webWorker.service';

import Worker from 'worker-loader!../workers/crypto.worker';

export class WebWorkerService implements WebWorkerServiceAbstraction {
    workers = new Map<string, Worker>();

    create(name: string) {
        const worker = new Worker();
        this.workers.set(name, worker);
        return worker;
    }

    terminate(name: string): Promise<void> {
        const worker = this.workers.get(name);
        if (worker == null) {
            return;
        }

        worker.postMessage({
            type: 'clearCacheRequest',
        });
        return new Promise((resolve, reject) => {
            const terminateWorkerTimeout = setTimeout(() => {
                worker.terminate();
                this.workers.delete(name);
                resolve();
            }, 500);

            worker.addEventListener('message', event => {
                if (event.data.type === 'clearCacheResponse') {
                    worker.terminate();
                    this.workers.delete(name);
                    clearTimeout(terminateWorkerTimeout);
                    resolve();
                }
            });
        });
    }

    terminateAll(): Promise<void[]> {
        const promises: Promise<void>[] = [];
        this.workers.forEach((worker, name) => {
            promises.push(this.terminate(name));
        });
        if (promises.length === 0) {
            return;
        }
        return Promise.all(promises);
    }
}
