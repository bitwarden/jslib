import { PasswordHistory } from '../models/domain/passwordHistory';

export interface PasswordGenerationService {
    optionsCache: any;
    history: PasswordHistory[];
    generatePassword(options: any): string;
    getOptions(): any;
    saveOptions(options: any): Promise<any>;
    getHistory(): PasswordHistory[];
    addHistory(password: string): Promise<any>;
    clear(): Promise<any>;
}
