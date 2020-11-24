import log from 'electron-log';
import * as path from 'path';

import { isDev } from '../utils';

import { LogLevelType } from '../../enums/logLevelType';

import { LogService as LogServiceAbstraction } from '../../abstractions/log.service';

export class ElectronLogService implements LogServiceAbstraction {
    private timersMap: Map<string, bigint> = new Map();

    constructor(private filter: (level: LogLevelType) => boolean = null, logDir: string = null) {
        if (log.transports == null) {
            return;
        }

        log.transports.file.level = 'info';
        if (logDir != null) {
            log.transports.file.file = path.join(logDir, 'app.log');
        }
    }

    debug(message: string) {
        if (!isDev()) {
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
                log.debug(message);
                break;
            case LogLevelType.Info:
                log.info(message);
                break;
            case LogLevelType.Warning:
                log.warn(message);
                break;
            case LogLevelType.Error:
                log.error(message);
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
