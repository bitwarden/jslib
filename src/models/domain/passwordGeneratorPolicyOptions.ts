import Domain from './domainBase';

export class PasswordGeneratorPolicyOptions extends Domain {
    minLength: number = 0;
    useUppercase: boolean = false;
    useLowercase: boolean = false;
    useNumbers: boolean = false;
    numberCount: number = 0;
    useSpecial: boolean = false;
    specialCount: number = 0;

    constructor(
        minLength?: number,
        useUppercase?: boolean,
        useLowercase?: boolean,
        useNumbers?: boolean,
        numberCount?: number,
        useSpecial?: boolean,
        specialCount?: number) {
        super();

        if (minLength != null) {
            this.minLength = minLength;
        }

        if (useUppercase != null) {
            this.useUppercase = useUppercase;
        }

        if (useLowercase != null) {
            this.useLowercase = useLowercase;
        }

        if (useNumbers != null) {
            this.useNumbers = useNumbers;
        }

        if (numberCount != null) {
            this.numberCount = numberCount;
        }

        if (useSpecial != null) {
            this.useSpecial = useSpecial;
        }

        if (specialCount != null) {
            this.specialCount = specialCount;
        }
    }
}
