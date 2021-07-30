import { RuleData } from '@passcert/pwrules-annotations';
export abstract class PasswordRulesParserService {
    convertToBitwardensObject: (rules: RuleData[]) => any;
    resetRulesReferences: () => void;
}