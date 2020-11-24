import { LogLevelType } from '../../enums/logLevelType';

import { LogService as LogServiceAbstraction } from '../../abstractions/log.service';

export class ConsoleLogService implements LogServiceAbstraction {
    private timersMap: Map<string, bigint> = new Map();

    constructor(private isDev: boolean, private filter: (level: LogLevelType) => boolean = null) { }

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

        if (process.env.BW_RESPONSE) {
            // tslint:disable-next-line
            console.error(message);
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
        if (!this.timersMap.has(label)) {
            this.timersMap.set(label, process.hrtime.bigint());
        }
    }

    timeEnd(label: string = 'default'): bigint {
        const elapsed = (process.hrtime.bigint() - this.timersMap.get(label)) / BigInt(1000000);
        this.timersMap.delete(label);
        this.write(LogLevelType.Info, `${label}: ${elapsed}ms`);
        return elapsed;
    }
}
