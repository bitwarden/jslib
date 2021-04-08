import { ConsoleLogService } from './consoleLog.service';

import { WebWorkerService as WebWorkerServiceAbstraction } from '../abstractions/webWorker.service';

import Worker from 'worker-loader!../workers/crypto.worker';

export class WebWorkerService implements WebWorkerServiceAbstraction {
    constructor(private logService: ConsoleLogService) { }

    createWorker() {
        const worker = new Worker();
        this.attachLogger(worker);
        return worker;
    }

    attachLogger(worker: Worker) {
        worker.addEventListener('message', event => {
            if (event.data.type === 'logMessage') {
                this.logService.info(event.data.message);
            }
        });
    }
}
