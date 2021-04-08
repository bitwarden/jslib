export class WorkerLogService {
    worker: any

    constructor(worker: any) { 
        this.worker = worker;
    }

    error(message: string) {
        this.worker.postMessage(message);
    }
}
