import Domain from './domainBase';

export class PasswordGeneratorPolicyOptions extends Domain {
    defaultType: string = '';
    minLength: number = 0;
    useUppercase: boolean = false;
    useLowercase: boolean = false;
    useNumbers: boolean = false;
    numberCount: number = 0;
    useSpecial: boolean = false;
    specialCount: number = 0;
    minNumberWords: number = 0;
    capitalize: boolean = false;
    includeNumber: boolean = false;

    inEffect() {
        return this.defaultType !== '' ||
            this.minLength > 0 ||
            this.numberCount > 0 ||
            this.specialCount > 0 ||
            this.useUppercase ||
            this.useLowercase ||
            this.useNumbers ||
            this.useSpecial ||
            this.minNumberWords > 0 ||
            this.capitalize ||
            this.includeNumber;
    }
}
