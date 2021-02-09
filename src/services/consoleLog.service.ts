import { LogLevelType } from '../enums/logLevelType';

import { LogService as LogServiceAbstraction } from '../abstractions/log.service';

import * as hrtime from 'browser-hrtime';

export class ConsoleLogService implements LogServiceAbstraction {
    protected timersMap: Map<string, [number, number]> = new Map();

    constructor(protected isDev: boolean, protected filter: (level: LogLevelType) => boolean = null) { }

    debug(message?: any, ...optionalParams: any[]) {
        if (!this.isDev) {
            return;
        }
        this.write(LogLevelType.Debug, message);
    }

    info(message?: any, ...optionalParams: any[]) {
        this.write(LogLevelType.Info, message);
    }

    warning(message?: any, ...optionalParams: any[]) {
        this.write(LogLevelType.Warning, message);
    }

    error(message?: any, ...optionalParams: any[]) {
        this.write(LogLevelType.Error, message);
    }

    write(level: LogLevelType, message?: any, ...optionalParams: any[]) {
        if (this.filter != null && this.filter(level)) {
            return;
        }

        switch (level) {
            case LogLevelType.Debug:
                // tslint:disable-next-line
                console.log(message, optionalParams);
                break;
            case LogLevelType.Info:
                // tslint:disable-next-line
                console.log(message, optionalParams);
                break;
            case LogLevelType.Warning:
                // tslint:disable-next-line
                console.warn(message, optionalParams);
                break;
            case LogLevelType.Error:
                // tslint:disable-next-line
                console.error(message, optionalParams);
                break;
            default:
                break;
        }
    }

    time(label: string = 'default') {
        if (!this.timersMap.has(label)) {
            this.timersMap.set(label, hrtime());
        }
    }

    timeEnd(label: string = 'default'): [number, number] {
        const elapsed = hrtime(this.timersMap.get(label));
        this.timersMap.delete(label);
        this.write(LogLevelType.Info, `${label}: ${elapsed[0] * 1000 + elapsed[1] / 10e6}ms`);
        return elapsed;
    }
}
