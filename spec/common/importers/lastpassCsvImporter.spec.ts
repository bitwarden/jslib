import { LastPassCsvImporter as Importer } from '../../../src/importers/lastpassCsvImporter';
import { CipherView } from '../../../src/models/view/cipherView';

import { Utils } from '../../../src/misc/utils';

if (Utils.isNode) {
    // Polyfills
    // tslint:disable-next-line
    const jsdom: any = require('jsdom');
    (global as any).DOMParser = new jsdom.JSDOM().window.DOMParser;
}

const CipherData = [
    {
        title: 'should parse expiration date',
        csv: `url,username,password,extra,name,grouping,fav
http://sn,,,"NoteType:Credit Card
Name on Card:John Doe
Type:
Number:1234567812345678
Security Code:123
Start Date:October,2017
Expiration Date:June,2020
Notes:some text
",Credit-card,,0`,
        expected: Object.assign(new CipherView(), {
                id: null,
                organizationId: null,
                folderId: null,
                name: 'Credit-card',
                notes: 'Start Date: October,2017\nsome text\n',
                type: 3,
                card: {
                    cardholderName: 'John Doe',
                    number: '1234567812345678',
                    code: '123',
                    expYear: '2020',
                    expMonth: '6',
                },
        }),
    },
    {
        title: 'should parse blank card note',
        csv: `url,username,password,extra,name,grouping,fav
http://sn,,,"NoteType:Credit Card
Name on Card:
Type:
Number:
Security Code:
Start Date:,
Expiration Date:,
Notes:",empty,,0`,
        expected: Object.assign(new CipherView(), {
                id: null,
                organizationId: null,
                folderId: null,
                name: 'empty',
                notes: `Start Date: ,`,
                type: 3,
                card: {},
        }),
    },
    {
        title: 'should parse card expiration date w/ no exp year',
        csv: `url,username,password,extra,name,grouping,fav
http://sn,,,"NoteType:Credit Card
Name on Card:John Doe
Type:Visa
Number:1234567887654321
Security Code:321
Start Date:,
Expiration Date:January,
Notes:",noyear,,0`,
        expected: Object.assign(new CipherView(), {
                id: null,
                organizationId: null,
                folderId: null,
                name: 'noyear',
                notes: `Type: Visa
Start Date: ,`,
                type: 3,
                card: {
                    cardholderName: 'John Doe',
                    number: '1234567887654321',
                    code: '321',
                    expMonth: '1',
                },
        }),
    },
    {
        title: 'should parse card expiration date w/ no month',
        csv: `url,username,password,extra,name,grouping,fav
http://sn,,,"NoteType:Credit Card
Name on Card:John Doe
Type:Mastercard
Number:8765432112345678
Security Code:987
Start Date:,
Expiration Date:,2020
Notes:",nomonth,,0`,
        expected: Object.assign(new CipherView(), {
                id: null,
                organizationId: null,
                folderId: null,
                name: 'nomonth',
                notes: `Type: Mastercard
Start Date: ,`,
                type: 3,
                card: {
                    cardholderName: 'John Doe',
                    number: '8765432112345678',
                    code: '987',
                    expYear: '2020',
                },
        }),
    },
];

const Imports = [
    {
        title: 'should parse custom note type date',
        csv: `url,username,password,extra,name,grouping,fav
http://sn,,,"NoteType:Custom_1399315180831972306
Language:en-US
textfield:frank
copytextfield:willowby
monthdayyear:January,1,2020
monthyear:January,2021
passkey:fr@nk
Notes:some notes",test-import-custom-type,Social,0`,
        expected: {},
    },
];

describe('Lastpass CSV Importer', () => {
    CipherData.forEach((data) => {
        it(data.title, async () => {
            const importer = new Importer();
            const result = importer.parse(data.csv);
            expect(result != null).toBe(true);
            expect(result.ciphers.length).toBeGreaterThan(0);

            const cipher = result.ciphers.shift();
            for (const property in data.expected) {
                if (data.expected.hasOwnProperty(property)) {
                    expect(cipher.hasOwnProperty(property)).toBe(true);
                    expect(cipher[property]).toEqual(data.expected[property]);
                }
            }
        });
    });
    Imports.forEach((data) => {
        it(data.title, async () => {
            const importer = new Importer();
            const result = importer.parse(data.csv);
            expect(result != null).toBe(true);
            expect(result.ciphers.length).toBeGreaterThan(0);
        });
    });
});
