import { RuleData } from "../models/data/passwordRules/ruleData";

export abstract class PasswordRulesParserService {
    parsePasswordRules: (input: string, formatRulesForMinifiedVersion?: boolean) => any[];
    convertToBitwardensObject: (rules: RuleData[]) => any;
    //parsePasswordRules: (input: string, formatRulesForMinifiedVersion?: boolean) => Rule[];
}