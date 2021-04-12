import { LogLevelType } from '../../enums/logLevelType';

export class WorkerLogService {
    worker: any;

    constructor(protected isDev: boolean, protected filter: (level: LogLevelType) => boolean = null, worker: Worker) {
        this.worker = worker;
     }

    debug(message: string) {
        if (!this.isDev) {
            return;
        }
        this.write(LogLevelType.Debug, message);
    }

    info(message: string) {
        this.write(LogLevelType.Info, message);
    }

    warning(message: string) {
        this.write(LogLevelType.Warning, message);
    }

    error(message: string) {
        this.write(LogLevelType.Error, message);
    }

    write(level: LogLevelType, message: string) {
        if (this.filter != null && this.filter(level)) {
            return;
        }

        switch (level) {
            case LogLevelType.Debug:
                // tslint:disable-next-line
                console.log(message);
                break;
            case LogLevelType.Info:
                // tslint:disable-next-line
                console.log(message);
                break;
            case LogLevelType.Warning:
                // tslint:disable-next-line
                console.warn(message);
                break;
            case LogLevelType.Error:
                // tslint:disable-next-line
                console.error(message);
                break;
            default:
                break;
        }
    }

    time(label: string = 'default') {
        throw new Error('Not implemented');
    }

    timeEnd(label: string = 'default'): [number, number] {
        throw new Error('Not implemented');
    }
}
