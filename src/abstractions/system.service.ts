export abstract class SystemService {
    startProcessReload: () => void;
    cancelProcessReload: () => void;
    clearClipboard: (clipboardValue: string, timeoutMs?: number) => void;
    clearPendingClipboard: () => Promise<any>;
}
