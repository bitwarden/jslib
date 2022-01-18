// featureFlag: Test
export class TestService {
    static StaticMethod() {
        console.log('static method');
    }

    constructor() { }

    Print(s: string) {
        console.log(s);
    }
}

// endFeatureFlag
