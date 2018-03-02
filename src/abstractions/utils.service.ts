export abstract class UtilsService {
    copyToClipboard: (text: string, doc?: Document) => void;
    getHostname: (uriString: string) => string;
    getHost: (uriString: string) => string;
}
