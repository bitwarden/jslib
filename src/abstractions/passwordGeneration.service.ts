import { GeneratedPasswordHistory } from '../models/domain/generatedPasswordHistory';

export abstract class PasswordGenerationService {
    generatePassword: (options: any) => Promise<string>;
    getOptions: () => any;
    saveOptions: (options: any) => Promise<any>;
    getHistory: () => Promise<GeneratedPasswordHistory[]>;
    addHistory: (password: string) => Promise<any>;
    clear: () => Promise<any>;
}
