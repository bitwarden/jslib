// Copyright (c) 2019 - 2020 Apple Inc. Licensed under MIT License.
// Adapted to typescript and Bitwarden by João Miguel P. Campos (@mikibakaiki) for PassCert project.

import { PasswordRulesParserService as PasswordRulesParserServiceAbstraction } from '../abstractions/passwordRulesParser.service';
import { CustomCharacterData } from '../models/data/passwordRules/customCharacterData';
import { NamedCharacterData } from '../models/data/passwordRules/namedCharacterData';
import { RuleData } from '../models/data/passwordRules/ruleData';

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

const CHARACTER_CLASS_START_SENTINEL = "[";
const CHARACTER_CLASS_END_SENTINEL = "]";
const PROPERTY_VALUE_SEPARATOR = ",";
const PROPERTY_SEPARATOR = ";";
const PROPERTY_VALUE_START_SENTINEL = ":";

const SPACE_CODE_POINT = " ".codePointAt(0);

const SHOULD_NOT_BE_REACHED = "Should not be reached";

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

    parsePasswordRules(input: string, formatRulesForMinifiedVersion?: boolean): any[] {
        let passwordRules = this._parsePasswordRulesInternal(input) || [];

        // When formatting rules for minified version, we should keep the formatted rules
        // as similar to the input as possible. Avoid copying required rules to allowed rules.
        let suppressCopyingRequiredToAllowed = formatRulesForMinifiedVersion;

        let newPasswordRules: RuleData[] = [];
        let newAllowedValues: any[] = [];
        let minimumMaximumConsecutiveCharacters = null;
        let maximumMinLength = 0;
        let minimumMaxLength = null;

        for (let rule of passwordRules) {
            switch (rule.name) {
                case RuleName.MAX_CONSECUTIVE:
                    minimumMaximumConsecutiveCharacters = minimumMaximumConsecutiveCharacters ? Math.min(rule.value, minimumMaximumConsecutiveCharacters) : rule.value;
                    break;

                case RuleName.MIN_LENGTH:
                    maximumMinLength = Math.max(rule.value, maximumMinLength);
                    break;

                case RuleName.MAX_LENGTH:
                    minimumMaxLength = minimumMaxLength ? Math.min(rule.value, minimumMaxLength) : rule.value;
                    break;

                case RuleName.REQUIRED:
                    rule.value = this._canonicalizedPropertyValues(rule.value, formatRulesForMinifiedVersion);
                    newPasswordRules.push(rule);
                    if (!suppressCopyingRequiredToAllowed) {
                        newAllowedValues = newAllowedValues.concat(rule.value);
                    }
                    break;

                case RuleName.ALLOWED:
                    newAllowedValues = newAllowedValues.concat(rule.value);
                    break;
            }
        }

        newAllowedValues = this._canonicalizedPropertyValues(newAllowedValues, suppressCopyingRequiredToAllowed);
        if (!suppressCopyingRequiredToAllowed && !newAllowedValues.length) {
            newAllowedValues = [new NamedCharacterData(Identifier.ASCII_PRINTABLE)];
        }
        if (newAllowedValues.length) {
            newPasswordRules.push(new RuleData(RuleName.ALLOWED, newAllowedValues));
        }

        if (minimumMaximumConsecutiveCharacters !== null) {
            newPasswordRules.push(new RuleData(RuleName.MAX_CONSECUTIVE, minimumMaximumConsecutiveCharacters));
        }

        if (maximumMinLength > 0) {
            newPasswordRules.push(new RuleData(RuleName.MIN_LENGTH, maximumMinLength));
        }

        if (minimumMaxLength !== null) {
            newPasswordRules.push(new RuleData(RuleName.MAX_LENGTH, minimumMaxLength));
        }

        return newPasswordRules;
    }

    // MARK: Lexer functions

    private _isIdentifierCharacter(c: string): boolean {
        console.assert(c.length === 1);
        return c >= "a" && c <= "z" || c >= "A" && c <= "Z" || c === "-";
    }

    private _isASCIIDigit(c: string): boolean {
        console.assert(c.length === 1);
        return c >= "0" && c <= "9";
    }

    private _isASCIIPrintableCharacter(c: string): boolean {
        console.assert(c.length === 1);
        return c >= " " && c <= "~";
    }

    private _isASCIIWhitespace(c: string): boolean {
        console.assert(c.length === 1);
        return c === " " || c === "\f" || c === "\n" || c === "\r" || c === "\t";
    }

    // MARK: ASCII printable character bit set and canonicalization functions

    private _bitSetIndexForCharacter(c: string): number {
        console.assert(c.length == 1);
        return c.codePointAt(0) - SPACE_CODE_POINT;
    }

    private _characterAtBitSetIndex(index: number): string {
        return String.fromCodePoint(index + SPACE_CODE_POINT);
    }

    private _markBitsForNamedCharacterClass(bitSet: any[], namedCharacterClass: NamedCharacterData): void {
        console.assert(bitSet instanceof Array);
        console.assert(namedCharacterClass.name !== Identifier.UNICODE);
        console.assert(namedCharacterClass.name !== Identifier.ASCII_PRINTABLE);
        if (namedCharacterClass.name === Identifier.UPPER) {
            bitSet.fill(true, this._bitSetIndexForCharacter("A"), this._bitSetIndexForCharacter("Z") + 1);
        }
        else if (namedCharacterClass.name === Identifier.LOWER) {
            bitSet.fill(true, this._bitSetIndexForCharacter("a"), this._bitSetIndexForCharacter("z") + 1);
        }
        else if (namedCharacterClass.name === Identifier.DIGIT) {
            bitSet.fill(true, this._bitSetIndexForCharacter("0"), this._bitSetIndexForCharacter("9") + 1);
        }
        else if (namedCharacterClass.name === Identifier.SPECIAL) {
            bitSet.fill(true, this._bitSetIndexForCharacter(" "), this._bitSetIndexForCharacter("/") + 1);
            bitSet.fill(true, this._bitSetIndexForCharacter(":"), this._bitSetIndexForCharacter("@") + 1);
            bitSet.fill(true, this._bitSetIndexForCharacter("["), this._bitSetIndexForCharacter("`") + 1);
            bitSet.fill(true, this._bitSetIndexForCharacter("{"), this._bitSetIndexForCharacter("~") + 1);
        }
        else {
            console.assert(false, SHOULD_NOT_BE_REACHED, namedCharacterClass);
        }
    }

    private _markBitsForCustomCharacterClass(bitSet: any[], customCharacterClass: CustomCharacterData): void {
        for (let character of customCharacterClass.characters) {
            bitSet[this._bitSetIndexForCharacter(character)] = true;
        }
    }

    private _canonicalizedPropertyValues(propertyValues: any[], keepCustomCharacterClassFormatCompliant: boolean): any[] {
        let asciiPrintableBitSet = new Array("~".codePointAt(0) - " ".codePointAt(0) + 1);

        for (let propertyValue of propertyValues) {
            if (propertyValue instanceof NamedCharacterData) {
                if (propertyValue.name === Identifier.UNICODE) {
                    return [new NamedCharacterData(Identifier.UNICODE)];
                }

                if (propertyValue.name === Identifier.ASCII_PRINTABLE) {
                    return [new NamedCharacterData(Identifier.ASCII_PRINTABLE)];
                }

                this._markBitsForNamedCharacterClass(asciiPrintableBitSet, propertyValue);
            }
            else if (propertyValue instanceof CustomCharacterData) {
                this._markBitsForCustomCharacterClass(asciiPrintableBitSet, propertyValue);
            }
        }

        let charactersSeen: any[] = [];

        let checkRange = ((start: string, end: string): boolean => {
            let temp = [];
            for (let i = this._bitSetIndexForCharacter(start); i <= this._bitSetIndexForCharacter(end); ++i) {
                if (asciiPrintableBitSet[i]) {
                    temp.push(this._characterAtBitSetIndex(i));
                }
            }

            let result = temp.length === (this._bitSetIndexForCharacter(end) - this._bitSetIndexForCharacter(start) + 1);
            if (!result) {
                charactersSeen = charactersSeen.concat(temp);
            }
            return result;
        });

        let hasAllUpper = checkRange("A", "Z");
        let hasAllLower = checkRange("a", "z");
        let hasAllDigits = checkRange("0", "9");

        // Check for special characters, accounting for characters that are given special treatment (i.e. '-' and ']')
        let hasAllSpecial = false;
        let hasDash = false;
        let hasRightSquareBracket = false;
        let temp = [];
        for (let i = this._bitSetIndexForCharacter(" "); i <= this._bitSetIndexForCharacter("/"); ++i) {
            if (!asciiPrintableBitSet[i]) {
                continue;
            }

            let character = this._characterAtBitSetIndex(i);
            if (keepCustomCharacterClassFormatCompliant && character === "-") {
                hasDash = true;
            }
            else {
                temp.push(character);
            }
        }
        for (let i = this._bitSetIndexForCharacter(":"); i <= this._bitSetIndexForCharacter("@"); ++i) {
            if (asciiPrintableBitSet[i]) {
                temp.push(this._characterAtBitSetIndex(i));
            }
        }
        for (let i = this._bitSetIndexForCharacter("["); i <= this._bitSetIndexForCharacter("`"); ++i) {
            if (!asciiPrintableBitSet[i]) {
                continue;
            }

            let character = this._characterAtBitSetIndex(i);
            if (keepCustomCharacterClassFormatCompliant && character === "]") {
                hasRightSquareBracket = true;
            }
            else {
                temp.push(character);
            }
        }
        for (let i = this._bitSetIndexForCharacter("{"); i <= this._bitSetIndexForCharacter("~"); ++i) {
            if (asciiPrintableBitSet[i]) {
                temp.push(this._characterAtBitSetIndex(i));
            }
        }

        if (hasDash) {
            temp.unshift("-");
        }
        if (hasRightSquareBracket) {
            temp.push("]");
        }

        let numberOfSpecialCharacters = (this._bitSetIndexForCharacter("/") - this._bitSetIndexForCharacter(" ") + 1)
            + (this._bitSetIndexForCharacter("@") - this._bitSetIndexForCharacter(":") + 1)
            + (this._bitSetIndexForCharacter("`") - this._bitSetIndexForCharacter("[") + 1)
            + (this._bitSetIndexForCharacter("~") - this._bitSetIndexForCharacter("{") + 1);
        hasAllSpecial = temp.length === numberOfSpecialCharacters;
        if (!hasAllSpecial) {
            charactersSeen = charactersSeen.concat(temp);
        }

        let result = [];
        if (hasAllUpper && hasAllLower && hasAllDigits && hasAllSpecial) {
            return [new NamedCharacterData(Identifier.ASCII_PRINTABLE)];
        }
        if (hasAllUpper) {
            result.push(new NamedCharacterData(Identifier.UPPER));
        }
        if (hasAllLower) {
            result.push(new NamedCharacterData(Identifier.LOWER));
        }
        if (hasAllDigits) {
            result.push(new NamedCharacterData(Identifier.DIGIT));
        }
        if (hasAllSpecial) {
            result.push(new NamedCharacterData(Identifier.SPECIAL));
        }
        if (charactersSeen.length) {
            result.push(new CustomCharacterData(charactersSeen));
        }
        return result;
    }

    // MARK: Parser functions

    private _indexOfNonWhitespaceCharacter(input: string, position = 0): number {
        console.assert(position >= 0);
        console.assert(position <= input.length);

        let length = input.length;
        while (position < length && this._isASCIIWhitespace(input[position]))
            ++position;

        return position;
    }

    private _parseIdentifier(input: string, position: number): [string, number] {
        console.assert(position >= 0);
        console.assert(position < input.length);
        console.assert(this._isIdentifierCharacter(input[position]));

        let length = input.length;
        let seenIdentifiers = [];
        do {
            let c = input[position];
            if (!this._isIdentifierCharacter(c)) {
                break;
            }

            seenIdentifiers.push(c);
            ++position;
        } while (position < length);

        return [seenIdentifiers.join(""), position];
    }

    private _isValidRequiredOrAllowedPropertyValueIdentifier(identifier: string): boolean {
        return identifier && Object.values(Identifier).includes(identifier.toLowerCase());
    }

    private _parseCustomCharacterClass(input: string, position: number): [string[], number] {
        console.assert(position >= 0);
        console.assert(position < input.length);
        console.assert(input[position] === CHARACTER_CLASS_START_SENTINEL);

        let length = input.length;
        ++position;
        if (position >= length) {
            console.error("Found end-of-line instead of character class character");
            return [null, position];
        }

        let initialPosition = position;
        let result = [];
        do {
            let c = input[position];
            if (!this._isASCIIPrintableCharacter(c)) {
                ++position;
                continue;
            }

            if (c === "-" && (position - initialPosition) > 0) {
                // FIXME: Should this be an error?
                console.warn("Ignoring '-'; a '-' may only appear as the first character in a character class");
                ++position;
                continue;
            }

            result.push(c);
            ++position;
            if (c === CHARACTER_CLASS_END_SENTINEL) {
                break;
            }
        } while (position < length);

        if (position < length && input[position] !== CHARACTER_CLASS_END_SENTINEL || position == length && input[position - 1] == CHARACTER_CLASS_END_SENTINEL) {
            // Fix up result; we over consumed.
            result.pop();
            return [result, position];
        }

        if (position < length && input[position] == CHARACTER_CLASS_END_SENTINEL) {
            return [result, position + 1];
        }

        console.error("Found end-of-line instead of end of character class");
        return [null, position];
    }

    private _parsePasswordRequiredOrAllowedPropertyValue(input: string, position: number): [any[], number] {
        console.assert(position >= 0);
        console.assert(position < input.length);

        let length = input.length;
        let propertyValues = [];
        while (true) {
            if (this._isIdentifierCharacter(input[position])) {
                let identifierStartPosition = position;
                var [propertyValue, position] = this._parseIdentifier(input, position);
                if (!this._isValidRequiredOrAllowedPropertyValueIdentifier(propertyValue)) {
                    console.error("Unrecognized property value identifier: " + propertyValue);
                    return [null, identifierStartPosition];
                }
                propertyValues.push(new NamedCharacterData(propertyValue));
            }
            else if (input[position] == CHARACTER_CLASS_START_SENTINEL) {
                var [propertyValueArray, position] = this._parseCustomCharacterClass(input, position);
                if (propertyValueArray && propertyValueArray.length) {
                    propertyValues.push(new CustomCharacterData(propertyValueArray));
                }
            }
            else {
                console.error("Failed to find start of property value: " + input.substr(position));
                return [null, position];
            }

            position = this._indexOfNonWhitespaceCharacter(input, position);
            if (position >= length || input[position] === PROPERTY_SEPARATOR) {
                break;
            }

            if (input[position] === PROPERTY_VALUE_SEPARATOR) {
                position = this._indexOfNonWhitespaceCharacter(input, position + 1);
                if (position >= length) {
                    console.error("Found end-of-line instead of start of next property value");
                    return [null, position];
                }
                continue;
            }

            console.error("Failed to find start of next property or property value: " + input.substr(position));
            return [null, position];
        }
        return [propertyValues, position];
    }

    private _parsePasswordRule(input: string, position: number): [RuleData, number] {
        console.assert(position >= 0);
        console.assert(position < input.length);
        console.assert(this._isIdentifierCharacter(input[position]));

        let length = input.length;

        var mayBeIdentifierStartPosition = position;
        var [identifier, position] = this._parseIdentifier(input, position);
        if (!Object.values(RuleName).includes(identifier)) {
            console.error("Unrecognized property name: " + identifier);
            return [null, mayBeIdentifierStartPosition];
        }

        if (position >= length) {
            console.error("Found end-of-line instead of start of property value");
            return [null, position];
        }

        if (input[position] !== PROPERTY_VALUE_START_SENTINEL) {
            console.error("Failed to find start of property value: " + input.substr(position));
            return [null, position];
        }
        //@ts-ignore
        let property = { name: identifier, propValue: null };

        position = this._indexOfNonWhitespaceCharacter(input, position + 1);
        // Empty value
        if (position >= length || input[position] === PROPERTY_SEPARATOR) {
            return [new RuleData(property.name, property.propValue), position];
        }

        switch (identifier) {
            case RuleName.ALLOWED:
            case RuleName.REQUIRED: {
                var [propertyValue, position] = this._parsePasswordRequiredOrAllowedPropertyValue(input, position);
                if (propertyValue) {
                    property.propValue = propertyValue;
                }
                return [new RuleData(property.name, property.propValue), position];
            }
            case RuleName.MAX_CONSECUTIVE: {
                var [maxConsec, position] = this._parseMaxConsecutivePropertyValue(input, position);
                if (maxConsec) {
                    property.propValue = maxConsec;
                }
                return [new RuleData(property.name, property.propValue), position];
            }
            case RuleName.MIN_LENGTH:
            case RuleName.MAX_LENGTH: {
                var [minMaxLength, position] = this._parseMinLengthMaxLengthPropertyValue(input, position);
                if (minMaxLength) {
                    property.propValue = minMaxLength;
                }
                return [new RuleData(property.name, property.propValue), position];
            }
        }
        console.assert(false, SHOULD_NOT_BE_REACHED);
    }

    private _parseMinLengthMaxLengthPropertyValue(input: string, position: number): [number, number] {
        return this._parseInteger(input, position);
    }

    private _parseMaxConsecutivePropertyValue(input: string, position: number): [number, number] {
        return this._parseInteger(input, position);
    }

    private _parseInteger(input: string, position: number): [number, number] {
        console.assert(position >= 0);
        console.assert(position < input.length);

        if (!this._isASCIIDigit(input[position])) {
            console.error("Failed to parse value of type integer; not a number: " + input.substr(position));
            return [null, position];
        }

        let length = input.length;
        let initialPosition = position;
        let result = 0;
        do {
            result = 10 * result + parseInt(input[position], 10);
            ++position;
        } while (position < length && input[position] !== PROPERTY_SEPARATOR && this._isASCIIDigit(input[position]));

        if (position >= length || input[position] === PROPERTY_SEPARATOR) {
            return [result, position];
        }

        console.error("Failed to parse value of type integer; not a number: " + input.substr(initialPosition));
        return [null, position];
    }

    private _parsePasswordRulesInternal(input: string): RuleData[] {
        let parsedProperties: RuleData[] = [];
        let length = input.length;

        var position = this._indexOfNonWhitespaceCharacter(input);
        while (position < length) {
            if (!this._isIdentifierCharacter(input[position])) {
                console.warn("Failed to find start of property: " + input.substr(position));
                return parsedProperties;
            }

            var [parsedProperty, position] = this._parsePasswordRule(input, position)
            if (parsedProperty && parsedProperty.value) {
                parsedProperties.push(parsedProperty);
            }

            position = this._indexOfNonWhitespaceCharacter(input, position);
            if (position >= length) {
                break;
            }

            if (input[position] === PROPERTY_SEPARATOR) {
                position = this._indexOfNonWhitespaceCharacter(input, position + 1);
                if (position >= length) {
                    return parsedProperties;
                }

                continue;
            }

            console.error("Failed to find start of next property: " + input.substr(position));
            return null;
        }

        return parsedProperties;
    }


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

