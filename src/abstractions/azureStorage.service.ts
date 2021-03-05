
export abstract class AzureStorageService {
    uploadFileToServer: (usl: string, data: ArrayBuffer, renewalCallback: () => Promise<string>) => Promise<any>;
}
