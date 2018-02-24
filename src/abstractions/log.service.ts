export abstract class LogService {
    debug: (message: string) => void;
    info: (message: string) => void;
    warning: (message: string) => void;
    error: (message: string) => void;
    write: (type: string, message: string) => void;
}
