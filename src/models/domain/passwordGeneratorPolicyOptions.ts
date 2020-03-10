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
}
