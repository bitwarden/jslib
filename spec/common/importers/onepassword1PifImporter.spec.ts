import { FieldType } from '../../../src/enums/fieldType';
import { OnePassword1PifImporter as Importer } from '../../../src/importers/onepassword1PifImporter';

import { Utils } from '../../../src/misc/utils';

if (Utils.isNode) {
    // Polyfills
    // tslint:disable-next-line
    const jsdom: any = require('jsdom');
    (global as any).DOMParser = new jsdom.JSDOM().window.DOMParser;
}

const TestData: string = `***aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee***\n` +
    JSON.stringify({
    uuid: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    updatedAt: 1486071244,
    securityLevel: 'SL5',
    contentsHash: 'aaaaaaaa',
    title: 'Imported Entry',
    location: 'https://www.google.com',
    secureContents: {
        fields: [
            {
                value: 'user@test.net',
                id: 'email-input',
                name: 'email',
                type: 'T',
                designation: 'username',
            },
            {
                value: 'myservicepassword',
                id: 'password-input',
                name: 'password',
                type: 'P',
                designation: 'password',
            },
        ],
        sections: [
            {
                fields: [
                    {
                        k: 'concealed',
                        n: 'AAAAAAAAAAAABBBBBBBBBBBCCCCCCCCC',
                        v: 'console-password-123',
                        t: 'console password',
                    },
                ],
                title: 'Admin Console',
                name: 'admin_console',
            },
        ],
    },
    URLs: [
        {
            label: 'website',
            url: 'https://www.google.com',
        },
    ],
    txTimestamp: 1508941334,
    createdAt: 1390426636,
    typeName: 'webforms.WebForm',
});

fdescribe('1Password 1Pif Importer', () => {
    it('should parse data', async () => {
        const importer = new Importer();
        const result = importer.parse(TestData);
        expect(result != null).toBe(true);

        const cipher = result.ciphers.shift();
        expect(cipher.login.username).toEqual('user@test.net');
        expect(cipher.login.password).toEqual('myservicepassword');
        expect(cipher.login.uris.length).toEqual(1);
        const uriView = cipher.login.uris.shift();
        expect(uriView.uri).toEqual('https://www.google.com');
    });

    it('should create concealed field as "hidden" type', async () => {
        const importer = new Importer();
        const result = importer.parse(TestData);
        expect(result != null).toBe(true);

        const ciphers = result.ciphers;
        expect(ciphers.length).toEqual(1);

        const cipher = ciphers.shift();
        const fields = cipher.fields;
        expect(fields.length).toEqual(1);

        const field = fields.shift();
        expect(field.name).toEqual('console password');
        expect(field.value).toEqual('console-password-123');
        expect(field.type).toEqual(FieldType.Hidden);
    });
});
