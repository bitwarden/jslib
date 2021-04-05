import { FirefoxCsvImporter as Importer } from '../../../src/importers/firefoxCsvImporter';

import { CipherView } from '../../../src/models/view/cipherView';
import { LoginView } from '../../../src/models/view/loginView';
import { LoginUriView } from '../../../src/models/view/loginUriView';

import { Utils } from '../../../src/misc/utils';

import { FieldType } from '../../../src/enums';

if (Utils.isNode) {
    // Polyfills
    // tslint:disable-next-line
    const jsdom: any = require('jsdom');
    (global as any).DOMParser = new jsdom.JSDOM().window.DOMParser;
}

const CipherData = [
    {
        title: 'should parse password',
        csv: `"url","username","password","httpRealm","formActionOrigin","guid","timeCreated","timeLastUsed","timePasswordChanged"
"https://example.com","foo","bar",,"","{d61e37fa-2bc4-469a-bd66-41fd3b0005e0}","1612345678900","1612345678900","1612345678900"
`,
        expected: Object.assign(new CipherView(), {
            id: null,
            organizationId: null,
            folderId: null,
            name: 'example.com',
            login: Object.assign(new LoginView(), {
                username: 'foo',
                password: 'bar',
                uris: [
                    Object.assign(new LoginUriView(), {
                        uri: "https://example.com",
                    }),
                ],
            }),
            notes: null,
            type: 1,
        }),
    },
    {
        title: 'should skip "chrome://FirefoxAccounts"',
        csv: `"url","username","password","httpRealm","formActionOrigin","guid","timeCreated","timeLastUsed","timePasswordChanged"
"chrome://FirefoxAccounts","bla-bla-foo-bar","{""version"":1,""accountData"":{""kSync"":""xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"",""kXCS"":""xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"",""kExtSync"":""xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"",""kExtKbHash"":""xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"",""scopedKeys"":{""https://identity.mozilla.com/apps/oldsync"":{""kid"":""xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",""k"":""xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"",""kty"":""xxx""},""sync:addon_storage"":{""kid"":""xxxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"",""k"":""xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"",""kty"":""xxx""}}}}","Firefox Accounts credentials",,"{d61e37fa-2bc4-469a-bd66-41fd3b0005e0}","1612345678900","1612345678900","1612345678900"
"https://example.com","foo","bar",,"","{d61e37fa-2bc4-469a-bd66-41fd3b0005e0}","1612345678900","1612345678900","1612345678900"
`,
        expected: Object.assign(new CipherView(), {
            id: null,
            organizationId: null,
            folderId: null,
            name: 'example.com',
            login: Object.assign(new LoginView(), {
                username: 'foo',
                password: 'bar',
                uris: [
                    Object.assign(new LoginUriView(), {
                        uri: "https://example.com",
                    }),
                ],
            }),
            notes: null,
            type: 1,
        }),
    },
];

describe('Firefox CSV Importer', () => {
    CipherData.forEach(data => {
        it(data.title, async () => {
            const importer = new Importer();
            const result = await importer.parse(data.csv);
            expect(result != null).toBe(true);
            expect(result.ciphers.length).toBeGreaterThan(0);

            const cipher = result.ciphers.shift();
            let property: keyof typeof data.expected;
            for (property in data.expected) {
                if (data.expected.hasOwnProperty(property)) {
                    expect(cipher.hasOwnProperty(property)).toBe(true);
                    expect(cipher[property]).toEqual(data.expected[property]);
                }
            }
        });
    });
});
