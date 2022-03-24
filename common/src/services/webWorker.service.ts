import { WebWorkerService as WebWorkerServiceAbstraction } from '../abstractions/webWorker.service';

export class WebWorkerService implements WebWorkerServiceAbstraction {
    constructor() {
        console.log('service up')
    }
    workers = new Map<string, Worker>();

    create(name: string) {

        if (!this.workers.has(name)) {
            // const worker = new Worker(new URL('../workers/crypto.worker.ts', import.meta.url));
            // worker.addEventListener('message', (e) => console.log(e));
            // this.workers.set(name, worker);
        }
        return this.workers.get(name);
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
            }, 250);

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
