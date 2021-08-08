import Domain from './domainBase';

export class MasterPasswordPolicyOptions extends Domain {
    minComplexity: number = 0;
    minLength: number = 0;
    requireUpper: boolean = false;
    requireLower: boolean = false;
    requireNumbers: boolean = false;
    requireSpecial: boolean = false;
}
