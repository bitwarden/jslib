export abstract class ExportService {
    getCsv: () => Promise<string>;
    getFileName: () => string;
}
