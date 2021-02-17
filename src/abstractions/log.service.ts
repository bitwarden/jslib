import { LogLevelType } from '../enums/logLevelType';
import { ConsoleLogService } from '../services/consoleLog.service';

export abstract class LogService {

    private static get instance() {
        if (this._instance == null) {
            this._instance = new ConsoleLogService(false);
        }
        return this._instance;
    }

    static set(logService: LogService) {
        this._instance = logService;
    }

    static debug(message?: any, ...optionalParams: any[]) {
        this.instance.debug(message, optionalParams);
    }

    static info(message?: any, ...optionalParams: any[]) {
        this.instance.info(message, optionalParams);
    }

    static warning(message?: any, ...optionalParams: any[]) {
        this.instance.warning(message, optionalParams);
    }

    static error(message?: any, ...optionalParams: any[]) {
        this.instance.error(message, optionalParams);
    }

    static time(label: string) {
        this.instance.time(label);
    }

    static timeEnd(label: string) {
        return this.instance.timeEnd(label);
    }
    private static _instance: LogService = null;

    debug: (message?: any, ...optionalParams: any[]) => void;
    info: (message?: any, ...optionalParams: any[]) => void;
    warning: (message?: any, ...optionalParams: any[]) => void;
    error: (message?: any, ...optionalParams: any[]) => void;
    write: (level: LogLevelType, message?: any, ...optionalParams: any[]) => void;
    time: (label: string) => void;
    timeEnd: (label: string) => [number, number];
}
