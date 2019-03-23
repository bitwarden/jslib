import { FieldType } from '../../../src/enums/fieldType';
import { OnePassword1PifImporter as Importer } from '../../../src/importers/onepassword1PifImporter';

import { Utils } from '../../../src/misc/utils';

if (Utils.isNode) {
    // Polyfills
    // tslint:disable-next-line
    const jsdom: any = require('jsdom');
    (global as any).DOMParser = new jsdom.JSDOM().window.DOMParser;
}

const TestData: string = '***aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee***\n' +
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

const IdentityTestData = JSON.stringify({
    uuid: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    updatedAt: 1553365894,
    securityLevel: 'SL5',
    contentsHash: 'eeeeeeee',
    title: 'Test Identity',
    secureContents: {
        lastname: 'Fritzenberger',
        zip: '223344',
        birthdate_dd: '11',
        homephone: '+49 333 222 111',
        company: 'Web Inc.',
        firstname: 'Frank',
        birthdate_mm: '3',
        country: 'de',
        sex: 'male',
        sections: [
            {
                fields: [
                    {
                        k: 'string',
                        inputTraits: {
                            autocapitalization: 'Words',
                        },
                        n: 'firstname',
                        v: 'Frank',
                        a: {
                            guarded: 'yes',
                        },
                        t: 'first name',
                    },
                    {
                        k: 'string',
                        inputTraits: {
                            autocapitalization: 'Words',
                        },
                        n: 'initial',
                        v: 'MD',
                        a: {
                            guarded: 'yes',
                        },
                        t: 'initial',
                    },
                    {
                        k: 'string',
                        inputTraits: {
                            autocapitalization: 'Words',
                        },
                        n: 'lastname',
                        v: 'Fritzenberger',
                        a: {
                            guarded: 'yes',
                        },
                        t: 'last name',
                    },
                    {
                        k: 'menu',
                        v: 'male',
                        n: 'sex',
                        a: {
                            guarded: 'yes',
                        },
                        t: 'sex',
                    },
                    {
                        k: 'date',
                        v: 1552305660,
                        n: 'birthdate',
                        a: {
                            guarded: 'yes',
                        },
                        t: 'birth date',
                    },
                    {
                        k: 'string',
                        inputTraits: {
                            autocapitalization: 'Words',
                        },
                        n: 'occupation',
                        v: 'Engineer',
                        a: {
                            guarded: 'yes',
                        },
                        t: 'occupation',
                    },
                    {
                        k: 'string',
                        inputTraits: {
                            autocapitalization: 'Words',
                        },
                        n: 'company',
                        v: 'Web Inc.',
                        a: {
                            guarded: 'yes',
                        },
                        t: 'company',
                    },
                    {
                        k: 'string',
                        inputTraits: {
                            autocapitalization: 'Words',
                        },
                        n: 'department',
                        v: 'IT',
                        a: {
                            guarded: 'yes',
                        },
                        t: 'department',
                    },
                    {
                        k: 'string',
                        inputTraits: {
                            autocapitalization: 'Words',
                        },
                        n: 'jobtitle',
                        v: 'Developer',
                        a: {
                            guarded: 'yes',
                        },
                        t: 'job title',
                    },
                ],
                title: 'Identification',
                name: 'name',
            },
            {
                fields: [
                    {
                        k: 'address',
                        inputTraits: {
                            autocapitalization: 'Sentences',
                        },
                        n: 'address',
                        v: {
                            street: 'Mainstreet 1',
                            city: 'Berlin',
                            country: 'de',
                            zip: '223344',
                        },
                        a: {
                            guarded: 'yes',
                        },
                        t: 'address',
                    },
                    {
                        k: 'phone',
                        v: '+49 001 222 333 44',
                        n: 'defphone',
                        a: {
                            guarded: 'yes',
                        },
                        t: 'default phone',
                    },
                    {
                        k: 'phone',
                        v: '+49 333 222 111',
                        n: 'homephone',
                        a: {
                            guarded: 'yes',
                        },
                        t: 'home',
                    },
                    {
                        k: 'phone',
                        n: 'cellphone',
                        a: {
                            guarded: 'yes',
                        },
                        t: 'mobile',
                    },
                    {
                        k: 'phone',
                        n: 'busphone',
                        a: {
                            guarded: 'yes',
                        },
                        t: 'business',
                    },
                ],
                title: 'Address',
                name: 'address',
            },
            {
                fields: [
                    {
                        k: 'string',
                        n: 'username',
                        a: {
                            guarded: 'yes',
                        },
                        t: 'username',
                    },
                    {
                        k: 'string',
                        n: 'reminderq',
                        t: 'reminder question',
                    },
                    {
                        k: 'string',
                        n: 'remindera',
                        t: 'reminder answer',
                    },
                    {
                        k: 'string',
                        inputTraits: {
                            keyboard: 'EmailAddress',
                        },
                        n: 'email',
                        v: 'test@web.de',
                        a: {
                            guarded: 'yes',
                        },
                        t: 'email',
                    },
                    {
                        k: 'string',
                        n: 'website',
                        inputTraits: {
                            keyboard: 'URL',
                        },
                        t: 'website',
                    },
                    {
                        k: 'string',
                        n: 'icq',
                        t: 'ICQ',
                    },
                    {
                        k: 'string',
                        n: 'skype',
                        t: 'skype',
                    },
                    {
                        k: 'string',
                        n: 'aim',
                        t: 'AOL/AIM',
                    },
                    {
                        k: 'string',
                        n: 'yahoo',
                        t: 'Yahoo',
                    },
                    {
                        k: 'string',
                        n: 'msn',
                        t: 'MSN',
                    },
                    {
                        k: 'string',
                        n: 'forumsig',
                        t: 'forum signature',
                    },
                ],
                title: 'Internet Details',
                name: 'internet',
            },
            {
                title: 'Related Items',
                name: 'linked items',
            },
        ],
        initial: 'MD',
        address1: 'Mainstreet 1',
        city: 'Berlin',
        jobtitle: 'Developer',
        occupation: 'Engineer',
        department: 'IT',
        email: 'test@web.de',
        birthdate_yy: '2019',
        homephone_local: '+49 333 222 111',
        defphone_local: '+49 001 222 333 44',
        defphone: '+49 001 222 333 44',
    },
    txTimestamp: 1553365894,
    createdAt: 1553364679,
    typeName: 'identities.Identity',
});

describe('1Password 1Pif Importer', () => {
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

    it('should create identity records', async () => {
        const importer = new Importer();
        const result = importer.parse(IdentityTestData);
        expect(result != null).toBe(true);
        const cipher = result.ciphers.shift();
        expect(cipher.name).toEqual('Test Identity');

        const identity = cipher.identity;
        expect(identity.firstName).toEqual('Frank');
        expect(identity.middleName).toEqual('MD');
        expect(identity.lastName).toEqual('Fritzenberger');
        expect(identity.company).toEqual('Web Inc.');
        expect(identity.address1).toEqual('Mainstreet 1');
        expect(identity.country).toEqual('de');
        expect(identity.city).toEqual('Berlin');
        expect(identity.postalCode).toEqual('223344');
        expect(identity.phone).toEqual('+49 001 222 333 44');
        expect(identity.email).toEqual('test@web.de');

        // remaining fields as custom fields
        expect(cipher.fields.length).toEqual(6);
    });
});
