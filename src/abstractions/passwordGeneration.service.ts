import { PasswordHistory } from '../models/domain/passwordHistory';

export abstract class PasswordGenerationService {
    generatePassword: (options: any) => Promise<string>;
    getOptions: () => any;
    saveOptions: (options: any) => Promise<any>;
    getHistory: () => Promise<PasswordHistory[]>;
    addHistory: (password: string) => Promise<any>;
    clear: () => Promise<any>;
}
