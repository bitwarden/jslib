// Copyright (c) 2019 - 2020 Apple Inc. Licensed under MIT License.
// Adapted to typescript and Bitwarden by João Miguel P. Campos (@mikibakaiki) for PassCert project.

import { NamedCharacterData, RuleData, CustomCharacterData } from '@passcert/pwrules-annotations';
import { PasswordRulesParserService as PasswordRulesParserServiceAbstraction } from '../abstractions/passwordRulesParser.service';

const Identifier = {
    ASCII_PRINTABLE: "ascii-printable",
    DIGIT: "digit",
    LOWER: "lower",
    SPECIAL: "special",
    UNICODE: "unicode",
    UPPER: "upper",
};

const RuleName = {
    ALLOWED: "allowed",
    MAX_CONSECUTIVE: "max-consecutive",
    REQUIRED: "required",
    MIN_LENGTH: "minlength",
    MAX_LENGTH: "maxlength",
};

const PwDefaultOptions = {
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

let pwCanHaveNumbers: boolean = false;
let pwCanHaveUppercase: boolean = false;
let pwCanHaveLowercase: boolean = false;
let pwCanHaveSpecial: boolean = false;

let pwMinNumbers: number = 0;
let pwMinUppercase: number = 0;
let pwMinLowercase: number = 0;
let pwMinSpecial: number = 0;

export class PasswordRulesParserService implements PasswordRulesParserServiceAbstraction {

    convertToBitwardensObject(rules: RuleData[]): any {
        let lengthObj: any = {};

        lengthObj = this.applyPasswordLengthRules(rules);
        console.log("I got this lengthObj => ", lengthObj);
        rules.forEach(r => {
            switch (r.name) {
                case RuleName.MAX_CONSECUTIVE:
                    // do nothing for now, doesn't seem to be this option in bitwarden
                    console.log("I had a MAX_CONSECUTIVE rule, but it's not supported by bitwarden.");
                    break;
                case RuleName.ALLOWED:
                    console.log("Found ALLOWED");
                    this.applyPasswordRules(r.value);
                    break;
                case RuleName.REQUIRED:
                    console.log("Found REQUIRED");
                    this.applyPasswordRules(r.value, true);
                    break;
            }
        });

        let siteOptions = {
            length: lengthObj['length'],
            number: pwCanHaveNumbers,
            minNumber: pwMinNumbers,
            uppercase: pwCanHaveUppercase,
            minUppercase: pwMinUppercase,
            lowercase: pwCanHaveLowercase,
            minLowercase: pwMinLowercase,
            special: pwCanHaveSpecial,
            minSpecial: pwMinSpecial,
            type: 'smartpassword',
            minLength: lengthObj['minLength'] != 0 ? lengthObj['minLength'] : PwDefaultOptions['length'],
            maxLength: lengthObj['maxLength'] != 0 ? lengthObj['maxLength'] : 128,
            reqNumber: pwCanHaveNumbers && pwMinNumbers > 0,
            reqUpper: pwCanHaveUppercase && pwMinUppercase > 0,
            reqLower: pwCanHaveLowercase && pwMinLowercase > 0,
            reqSpecial: pwCanHaveSpecial && pwMinSpecial > 0,
            allowedNumber: pwCanHaveNumbers,
            allowedUpper: pwCanHaveUppercase,
            allowedLower: pwCanHaveLowercase,
            allowedSpecial: pwCanHaveSpecial,
        };
        console.log("I WILL RETURN THIS OVERALL SITE OPTIONS -> ", siteOptions);

        var aux = Object.assign({}, PwDefaultOptions, siteOptions);
        return aux;
    }

    private applyPasswordLengthRules(rules: RuleData[]) {
        // get the min and max length of password
        let lengthObj: any = {};
        let minLeng = 0;
        let maxLeng = 0;
        let pwLeng = PwDefaultOptions['length'];

        rules.forEach((r: any) => {
            if (r.name === RuleName.MIN_LENGTH) {
                minLeng = r.value;
            }
            if (r.name === RuleName.MAX_LENGTH) {
                maxLeng = r.value;
            }
        });
        console.log("Min Length => ", minLeng);
        console.log("Max Length => ", maxLeng);
        console.log("Default Leng -> ", pwLeng);

        if (maxLeng > minLeng) {
            // max is bigger than min
            if (maxLeng < pwLeng) {
                // max is lower than default. Update default
                pwLeng = maxLeng;
            } else if (minLeng > pwLeng) {
                pwLeng = minLeng;
            }
            console.log("min < max -> ", pwLeng);

        } else if (maxLeng == minLeng) {
            // password must have exactly the minLeng = maxLeng
            console.log("password MUST HAVE this size -> ", minLeng, maxLeng);
            pwLeng = minLeng;
            console.log(" max = min -> ", pwLeng);
        } else {
            // max is lower than min

            if (maxLeng != 0 && maxLeng < pwLeng) {
                // exists a max value and it's lower than the default value
                pwLeng = maxLeng;
            } else if (pwLeng < minLeng) {
                pwLeng = minLeng;
            }
            console.log(" else -> ", pwLeng);
        }
        console.log("default value | real length = " + PwDefaultOptions["length"] + " | " + pwLeng);
        lengthObj = { minLength: minLeng, maxLength: maxLeng, length: pwLeng };
        console.log("I WILL RETURN THIS -> ", lengthObj);
        return lengthObj;
    }

    private applyPasswordRules(rules: any[], required: boolean = false): void {

        let requiredValue = 0;
        if (required) {
            requiredValue = 1;
        }
        rules.forEach(charClass => {
            if (charClass instanceof NamedCharacterData) {
                switch (charClass.name) {
                    case Identifier.LOWER:
                        console.log("found LOWER");
                        pwCanHaveLowercase = true;
                        // if it's equal to 1, means it's required -> must have at least one
                        if (pwMinLowercase < 1) {
                            pwMinLowercase = requiredValue;
                        }
                        break;
                    case Identifier.DIGIT:
                        console.log("found DIGIT");
                        pwCanHaveNumbers = true;

                        if (pwMinNumbers < 1) {
                            pwMinNumbers = requiredValue;
                        }
                        break;
                    case Identifier.UPPER:
                        console.log("found UPPER");
                        pwCanHaveUppercase = true;

                        if (pwMinUppercase < 1) {
                            pwMinUppercase = requiredValue;
                        }
                        break;
                    case Identifier.SPECIAL:
                        console.log("found SPECIAL");
                        pwCanHaveSpecial = true;
                        if (pwMinSpecial < 1) {
                            pwMinSpecial = requiredValue;
                        }
                        break;
                    case Identifier.ASCII_PRINTABLE:
                        console.log("found ASCII");
                        pwCanHaveLowercase = true;
                        if (pwMinLowercase < 1) {
                            pwMinLowercase = requiredValue;
                        }
                        pwCanHaveNumbers = true;
                        if (pwMinNumbers < 1) {
                            pwMinNumbers = requiredValue;
                        }
                        pwCanHaveUppercase = true;
                        if (pwMinUppercase < 1) {
                            pwMinUppercase = requiredValue;
                        }
                        pwCanHaveSpecial = true;
                        if (pwMinSpecial < 1) {
                            pwMinSpecial = requiredValue;
                        }
                        break;
                }
            }
        });
    }

    resetRulesReferences(): void {
        pwCanHaveNumbers = false;
        pwCanHaveUppercase = false;
        pwCanHaveLowercase = false;
        pwCanHaveSpecial = false;

        pwMinNumbers = 0;
        pwMinUppercase = 0;
        pwMinLowercase = 0;
        pwMinSpecial = 0;
    }

}

