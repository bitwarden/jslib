import { PasswordHistory } from '../models/domain';

export abstract class PasswordGenerationService {
    generatePassword: (options: any) => string;
    getOptions: () => any;
    saveOptions: (options: any) => Promise<any>;
    getHistory: () => Promise<PasswordHistory[]>;
    addHistory: (password: string) => Promise<any>;
    clear: () => Promise<any>;
}
