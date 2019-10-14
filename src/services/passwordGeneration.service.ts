import * as zxcvbn from 'zxcvbn';

import { CipherString } from '../models/domain/cipherString';
import { GeneratedPasswordHistory } from '../models/domain/generatedPasswordHistory';

import { CryptoService } from '../abstractions/crypto.service';
import {
    PasswordGenerationService as PasswordGenerationServiceAbstraction,
} from '../abstractions/passwordGeneration.service';
import { StorageService } from '../abstractions/storage.service';

import { EEFLongWordList } from '../misc/wordlist';

const DefaultOptions = {
    length: 14,
    ambiguous: false,
    number: true,
    minNumber: 1,
    uppercase: true,
    minUppercase: 0,
    lowercase: true,
    minLowercase: 0,
    special: false,
    minSpecial: 1,
    type: 'password',
    numWords: 3,
    wordSeparator: '-',
    capitalize: false,
    includeNumber: false,
};

const Keys = {
    options: 'passwordGenerationOptions',
    history: 'generatedPasswordHistory',
};

const MaxPasswordsInHistory = 100;

export class PasswordGenerationService implements PasswordGenerationServiceAbstraction {
    private optionsCache: any;
    private history: GeneratedPasswordHistory[];

    constructor(private cryptoService: CryptoService, private storageService: StorageService) { }

    async generatePassword(options: any): Promise<string> {
        // overload defaults with given options
        const o = Object.assign({}, DefaultOptions, options);

        if (o.type === 'passphrase') {
            return this.generatePassphrase(options);
        }

        // sanitize
        if (o.uppercase && o.minUppercase <= 0) {
            o.minUppercase = 1;
        } else if (!o.uppercase) {
            o.minUppercase = 0;
        }

        if (o.lowercase && o.minLowercase <= 0) {
            o.minLowercase = 1;
        } else if (!o.lowercase) {
            o.minLowercase = 0;
        }

        if (o.number && o.minNumber <= 0) {
            o.minNumber = 1;
        } else if (!o.number) {
            o.minNumber = 0;
        }

        if (o.special && o.minSpecial <= 0) {
            o.minSpecial = 1;
        } else if (!o.special) {
            o.minSpecial = 0;
        }

        if (!o.length || o.length < 1) {
            o.length = 10;
        }

        const minLength: number = o.minUppercase + o.minLowercase + o.minNumber + o.minSpecial;
        if (o.length < minLength) {
            o.length = minLength;
        }

        const positions: string[] = [];
        if (o.lowercase && o.minLowercase > 0) {
            for (let i = 0; i < o.minLowercase; i++) {
                positions.push('l');
            }
        }
        if (o.uppercase && o.minUppercase > 0) {
            for (let i = 0; i < o.minUppercase; i++) {
                positions.push('u');
            }
        }
        if (o.number && o.minNumber > 0) {
            for (let i = 0; i < o.minNumber; i++) {
                positions.push('n');
            }
        }
        if (o.special && o.minSpecial > 0) {
            for (let i = 0; i < o.minSpecial; i++) {
                positions.push('s');
            }
        }
        while (positions.length < o.length) {
            positions.push('a');
        }

        // shuffle
        await this.shuffleArray(positions);

        // build out the char sets
        let allCharSet = '';

        let lowercaseCharSet = 'abcdefghijkmnopqrstuvwxyz';
        if (o.ambiguous) {
            lowercaseCharSet += 'l';
        }
        if (o.lowercase) {
            allCharSet += lowercaseCharSet;
        }

        let uppercaseCharSet = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
        if (o.ambiguous) {
            uppercaseCharSet += 'IO';
        }
        if (o.uppercase) {
            allCharSet += uppercaseCharSet;
        }

        let numberCharSet = '23456789';
        if (o.ambiguous) {
            numberCharSet += '01';
        }
        if (o.number) {
            allCharSet += numberCharSet;
        }

        const specialCharSet = '!@#$%^&*';
        if (o.special) {
            allCharSet += specialCharSet;
        }

        let password = '';
        for (let i = 0; i < o.length; i++) {
            let positionChars: string;
            switch (positions[i]) {
                case 'l':
                    positionChars = lowercaseCharSet;
                    break;
                case 'u':
                    positionChars = uppercaseCharSet;
                    break;
                case 'n':
                    positionChars = numberCharSet;
                    break;
                case 's':
                    positionChars = specialCharSet;
                    break;
                case 'a':
                    positionChars = allCharSet;
                    break;
                default:
                    break;
            }

            const randomCharIndex = await this.cryptoService.randomNumber(0, positionChars.length - 1);
            password += positionChars.charAt(randomCharIndex);
        }

        return password;
    }

    async generatePassphrase(options: any): Promise<string> {
        const o = Object.assign({}, DefaultOptions, options);

        if (o.numWords == null || o.numWords <= 2) {
            o.numWords = DefaultOptions.numWords;
        }
        if (o.wordSeparator == null || o.wordSeparator.length === 0 || o.wordSeparator.length > 1) {
            o.wordSeparator = ' ';
        }
        if (o.capitalize == null) {
            o.capitalize = false;
        }
        if (o.includeNumber == null) {
            o.includeNumber = false;
        }

        const listLength = EEFLongWordList.length - 1;
        const wordList = new Array(o.numWords);
        for (let i = 0; i < o.numWords; i++) {
            const wordIndex = await this.cryptoService.randomNumber(0, listLength);
            if (o.capitalize) {
                wordList[i] = this.capitalize(EEFLongWordList[wordIndex]);
            } else {
                wordList[i] = EEFLongWordList[wordIndex];
            }
        }

        if (o.includeNumber) {
            await this.appendRandomNumberToRandomWord(wordList);
        }
        return wordList.join(o.wordSeparator);
    }

    async getOptions() {
        if (this.optionsCache == null) {
            const options = await this.storageService.get(Keys.options);
            if (options == null) {
                this.optionsCache = DefaultOptions;
            } else {
                this.optionsCache = Object.assign({}, DefaultOptions, options);
            }
        }

        return this.optionsCache;
    }

    async saveOptions(options: any) {
        await this.storageService.save(Keys.options, options);
        this.optionsCache = options;
    }

    async getHistory(): Promise<GeneratedPasswordHistory[]> {
        const hasKey = await this.cryptoService.hasKey();
        if (!hasKey) {
            return new Array<GeneratedPasswordHistory>();
        }

        if (!this.history) {
            const encrypted = await this.storageService.get<GeneratedPasswordHistory[]>(Keys.history);
            this.history = await this.decryptHistory(encrypted);
        }

        return this.history || new Array<GeneratedPasswordHistory>();
    }

    async addHistory(password: string): Promise<any> {
        // Cannot add new history if no key is available
        const hasKey = await this.cryptoService.hasKey();
        if (!hasKey) {
            return;
        }

        const currentHistory = await this.getHistory();

        // Prevent duplicates
        if (this.matchesPrevious(password, currentHistory)) {
            return;
        }

        currentHistory.unshift(new GeneratedPasswordHistory(password, Date.now()));

        // Remove old items.
        if (currentHistory.length > MaxPasswordsInHistory) {
            currentHistory.pop();
        }

        const newHistory = await this.encryptHistory(currentHistory);
        return await this.storageService.save(Keys.history, newHistory);
    }

    async clear(): Promise<any> {
        this.history = [];
        return await this.storageService.remove(Keys.history);
    }

    passwordStrength(password: string, userInputs: string[] = null): zxcvbn.ZXCVBNResult {
        if (password == null || password.length === 0) {
            return null;
        }
        let globalUserInputs = ['bitwarden', 'bit', 'warden'];
        if (userInputs != null && userInputs.length > 0) {
            globalUserInputs = globalUserInputs.concat(userInputs);
        }
        // Use a hash set to get rid of any duplicate user inputs
        const finalUserInputs = Array.from(new Set(globalUserInputs));
        const result = zxcvbn(password, finalUserInputs);
        return result;
    }

    private capitalize(str: string) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    private async appendRandomNumberToRandomWord(wordList: string[]) {
        if (wordList == null || wordList.length <= 0) {
            return;
        }
        const index = await this.cryptoService.randomNumber(0, wordList.length - 1);
        const num = await this.cryptoService.randomNumber(0, 9);
        wordList[index] = wordList[index] + num;
    }

    private async encryptHistory(history: GeneratedPasswordHistory[]): Promise<GeneratedPasswordHistory[]> {
        if (history == null || history.length === 0) {
            return Promise.resolve([]);
        }

        const promises = history.map(async (item) => {
            const encrypted = await this.cryptoService.encrypt(item.password);
            return new GeneratedPasswordHistory(encrypted.encryptedString, item.date);
        });

        return await Promise.all(promises);
    }

    private async decryptHistory(history: GeneratedPasswordHistory[]): Promise<GeneratedPasswordHistory[]> {
        if (history == null || history.length === 0) {
            return Promise.resolve([]);
        }

        const promises = history.map(async (item) => {
            const decrypted = await this.cryptoService.decryptToUtf8(new CipherString(item.password));
            return new GeneratedPasswordHistory(decrypted, item.date);
        });

        return await Promise.all(promises);
    }

    private matchesPrevious(password: string, history: GeneratedPasswordHistory[]): boolean {
        if (history == null || history.length === 0) {
            return false;
        }

        return history[history.length - 1].password === password;
    }

    // ref: https://stackoverflow.com/a/12646864/1090359
    private async shuffleArray(array: string[]) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = await this.cryptoService.randomNumber(0, i);
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
}
