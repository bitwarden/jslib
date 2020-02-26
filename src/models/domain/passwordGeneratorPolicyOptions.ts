import Domain from './domainBase';

export class PasswordGeneratorPolicyOptions extends Domain {
    minLength: number = 0;
    useUppercase: boolean = false;
    useLowercase: boolean = false;
    useNumbers: boolean = false;
    numberCount: number = 0;
    useSpecial: boolean = false;
    specialCount: number = 0;
}
