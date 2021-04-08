export abstract class WebWorkerService {
    createWorker: () => Worker;
    attachLogger: (worker: Worker) => void;
}
