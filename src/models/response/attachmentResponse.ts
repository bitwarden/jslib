export class AttachmentResponse {
    id: string;
    url: string;
    fileName: string;
    key: string;
    size: number;
    sizeName: string;

    constructor(response: any) {
        this.id = response.Id;
        this.url = response.Url;
        this.fileName = response.FileName;
        this.key = response.Key;
        this.size = response.Size;
        this.sizeName = response.SizeName;
    }
}
