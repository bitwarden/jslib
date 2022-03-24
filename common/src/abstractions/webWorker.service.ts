export abstract class WebWorkerService {
    create: (name: string) => Worker;
    terminate: (name: string) => Promise<void>;
    terminateAll: () => Promise<void[]>;
}
