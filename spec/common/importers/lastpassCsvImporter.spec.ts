import { LastPassCsvImporter as Importer } from '../../../src/importers/lastpassCsvImporter';

import { CipherView } from '../../../src/models/view/cipherView';
import { FieldView } from '../../../src/models/view/fieldView';

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
            notes: 'some text\n',
            type: 3, //card
            card: {
                cardholderName: 'John Doe',
                number: '1234567812345678',
                code: '123',
                expYear: '2020',
                expMonth: '6',
            },
            fields: [
                Object.assign(new FieldView(), {
                    name: 'Start Date',
                    value: 'October,2017',
                    type: FieldType.Text,
                }),
            ],
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
            notes: null,
            type: 3, //card
            card: {
                expMonth: undefined,
            },
            fields: [
                Object.assign(new FieldView(), {
                    name: 'Start Date',
                    value: ',',
                    type: FieldType.Text,
                }),
            ],
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
            notes: null,
            type: 3, //card
            card: {
                cardholderName: 'John Doe',
                number: '1234567887654321',
                code: '321',
                expMonth: '1',
            },
            fields: [
                Object.assign(new FieldView(), {
                    name: 'Type',
                    value: 'Visa',
                    type: FieldType.Text,
                }),
                Object.assign(new FieldView(), {
                    name: 'Start Date',
                    value: ',',
                    type: FieldType.Text,
                }),
            ],
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
            notes: null,
            type: 3, //card
            card: {
                cardholderName: 'John Doe',
                number: '8765432112345678',
                code: '987',
                expYear: '2020',
                expMonth: undefined,
            },
            fields: [
                Object.assign(new FieldView(), {
                    name: 'Type',
                    value: 'Mastercard',
                    type: FieldType.Text,
                }),
                Object.assign(new FieldView(), {
                    name: 'Start Date',
                    value: ',',
                    type: FieldType.Text,
                }),
            ],
        }),
    },
    {
        title: 'should parse ssh keypair with secret custom fields hidden',
        csv: `url,username,password,extra,name,grouping,fav
http://sn,,,"NoteType:SSH Key
Language:en-US
Bit Strength:1024
Format:PEM
Passphrase:fr@nk
Private Key:-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEArWq88uJUJkhIxIEOvH4OYjnGCfC9LbPwJ/TXaXWNQfpVlITE
CcPkGwhdwqaJd6hl6tSeti3alIg6IjozyWaj35msLu4EzCD6zfUGyLpjAvvrGVuj
RtGgwtc0i+iRn4f4faoHlN5NLH5VKRrs0RtOhCA79tTl3ntbSdngUE6SDVw5bmOa
ub+2kBeiZHqONCoyjfYiyWvnxy4rkv8I5GfyFyfhA2lGfUa5dDB152e1WAPiOvfC
D/5U1mEI0JYRoK3XBIv/5vFQKOS7Mvw8txCJeeAGEUHlHUE02sfpkx0pdEqWuorB
AbabmuAQkt4xZYpI8cmi+I23OybzL/m8JQ+qUwIDAQABAoIBAFOXuyL9VIDroSAP
8fGMdhSFMuBByn9IWIB6NoggYQonyK8B3Jm0crVRMBkPO/6RDyfGfAbnTZEBpbww
AByaPG4hXm100J0xXJSBA1co+WdL1gTwNmGB1RN2t16lqeSTn4W7u1HYYq0K7LQW
xYb6ubtY6m7OK0w2fEe6HbW4WhDT01A/ChONk86D/cs5I5bzGbGDeKXOmDm//2nI
Z0cs6L/nDDyRVz5qul725ie3uDkh/HGne/LQ/m4vbWsfkNYACd2l6L4vREZpphDq
LYw6FgM/VGFW+of8gMdZEOBa0ATkHS0KBI49TjZ39VwTBV5wIu5i4PCe9tuNDLeF
UIisY8ECgYEA4M28CH7CKEAJKcNwQFc8OBA1BMHopSWSAllEo40AGGPmujC9e+Om
6dEe9YVdq3q/lTVs1sad3wP2YHSGQj+p3BvWtU4Y32s5BSAgo3YgfzxhgqVoPFsT
4YshL5MYFa8NxilZ9jYVx/WOkLd8LyRmZJLr9vmpheJwnPcCAKMOFCECgYEAxXt2
4/M+hPPMibvlYsLrbcJ0g044+XxS2tNAdf1VOp7X3m/TvEZic9mtGOU0ZXn2wt3i
ZGytKqr+cAkKcA9lufxYTs1S+pn7tLEFeWMa9F/C7T+gSXX0XgiLLkI2XDHKvXtj
8flfwFpd9L4eJVjpeG0+QXZIOCpihwipe+Dwr/MCgYEAr4k2eFOyfAd0oD3RmwwD
I6vUGoDnjn0Fw/u8kxD4sBLiCSUh8GlU3mLCj+ixucLBclsjP5obkBbh/XM/mt9n
XU4Hm879sQdioNPzaHBG89NMON27xNVBcu5W3XU4a0YjtUZ4zr5wx5DA39PGjnEX
2xS2WEWez8J/OLHPyHuJ9MECgYAykCYkv0cmq3WXXnChFN9Kvxst831LA7YDKUu7
6h1EYR9MaL2B21Oh7f4P/b+oq82unzk0FU9ROW7kKKxvfMHDGQVTR+cTGxIDdb+9
EM75+vrh3ASiSn1DBlT8hx98A5OxaEJy1jLaAUlFPNhjH5zHpNDn2e0r1E5d3K3o
dfOqWQKBgCo0HZyG7LNdf4p9uhu1hIn6iIt9EkaYpPgrXKO/NevkjzPrZsUn5reH
HPqAcOB3NaEsSy4bXfrFXIG8lHmyoJJCXUxmreA126yuBUyv2c6rVv6ChWk7YAti
02pUCRtEJ/s/2aa//TgFT3FKyN8KIcHwEH9j3pECBBMQS/+9YCk1
-----END RSA PRIVATE KEY-----
Public Key:ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCtarzy4lQmSEjEgQ68fg5iOcYJ8L0ts/An9NdpdY1B+lWUhMQJw+QbCF3Cpol3qGXq1J62LdqUiDoiOjPJZqPfmawu7gTMIPrN9QbIumMC++sZW6NG0aDC1zSL6JGfh/h9qgeU3k0sflUpGuzRG06EIDv21OXee1tJ2eBQTpINXDluY5q5v7aQF6Jkeo40KjKN9iLJa+fHLiuS/wjkZ/IXJ+EDaUZ9Rrl0MHXnZ7VYA+I698IP/lTWYQjQlhGgrdcEi//m8VAo5Lsy/Dy3EIl54AYRQeUdQTTax+mTHSl0Spa6isEBtpua4BCS3jFlikjxyaL4jbc7JvMv+bwlD6pT frank@frank-PC
Hostname:home.example.com
Date:January,3,1999
Notes:some notes",test-import-ssh-key,Social,0`,
        expected: Object.assign(new CipherView(), {
            id: null,
            organizationId: null,
            folderId: null,
            name: 'test-import-ssh-key',
            notes: 'some notes',
            type: 2, //secure note
            fields: [
                Object.assign(new FieldView(), {
                    name: 'Language',
                    value: 'en-US',
                    type: FieldType.Text,
                }),
                Object.assign(new FieldView(), {
                    name: 'Bit Strength',
                    value: '1024',
                    type: FieldType.Text,
                }),
                Object.assign(new FieldView(), {
                    name: 'Format',
                    value: 'PEM',
                    type: FieldType.Text,
                }),
                Object.assign(new FieldView(), {
                    name: 'Passphrase',
                    value: 'fr@nk',
                    type: FieldType.Hidden,
                }),
                Object.assign(new FieldView(), {
                    name: 'Private Key',
                    value: '-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEArWq88uJUJkhIxIEOvH4OYjnGCfC9LbPwJ/TXaXWNQfpVlITE\nCcPkGwhdwqaJd6hl6tSeti3alIg6IjozyWaj35msLu4EzCD6zfUGyLpjAvvrGVuj\nRtGgwtc0i+iRn4f4faoHlN5NLH5VKRrs0RtOhCA79tTl3ntbSdngUE6SDVw5bmOa\nub+2kBeiZHqONCoyjfYiyWvnxy4rkv8I5GfyFyfhA2lGfUa5dDB152e1WAPiOvfC\nD/5U1mEI0JYRoK3XBIv/5vFQKOS7Mvw8txCJeeAGEUHlHUE02sfpkx0pdEqWuorB\nAbabmuAQkt4xZYpI8cmi+I23OybzL/m8JQ+qUwIDAQABAoIBAFOXuyL9VIDroSAP\n8fGMdhSFMuBByn9IWIB6NoggYQonyK8B3Jm0crVRMBkPO/6RDyfGfAbnTZEBpbww\nAByaPG4hXm100J0xXJSBA1co+WdL1gTwNmGB1RN2t16lqeSTn4W7u1HYYq0K7LQW\nxYb6ubtY6m7OK0w2fEe6HbW4WhDT01A/ChONk86D/cs5I5bzGbGDeKXOmDm//2nI\nZ0cs6L/nDDyRVz5qul725ie3uDkh/HGne/LQ/m4vbWsfkNYACd2l6L4vREZpphDq\nLYw6FgM/VGFW+of8gMdZEOBa0ATkHS0KBI49TjZ39VwTBV5wIu5i4PCe9tuNDLeF\nUIisY8ECgYEA4M28CH7CKEAJKcNwQFc8OBA1BMHopSWSAllEo40AGGPmujC9e+Om\n6dEe9YVdq3q/lTVs1sad3wP2YHSGQj+p3BvWtU4Y32s5BSAgo3YgfzxhgqVoPFsT\n4YshL5MYFa8NxilZ9jYVx/WOkLd8LyRmZJLr9vmpheJwnPcCAKMOFCECgYEAxXt2\n4/M+hPPMibvlYsLrbcJ0g044+XxS2tNAdf1VOp7X3m/TvEZic9mtGOU0ZXn2wt3i\nZGytKqr+cAkKcA9lufxYTs1S+pn7tLEFeWMa9F/C7T+gSXX0XgiLLkI2XDHKvXtj\n8flfwFpd9L4eJVjpeG0+QXZIOCpihwipe+Dwr/MCgYEAr4k2eFOyfAd0oD3RmwwD\nI6vUGoDnjn0Fw/u8kxD4sBLiCSUh8GlU3mLCj+ixucLBclsjP5obkBbh/XM/mt9n\nXU4Hm879sQdioNPzaHBG89NMON27xNVBcu5W3XU4a0YjtUZ4zr5wx5DA39PGjnEX\n2xS2WEWez8J/OLHPyHuJ9MECgYAykCYkv0cmq3WXXnChFN9Kvxst831LA7YDKUu7\n6h1EYR9MaL2B21Oh7f4P/b+oq82unzk0FU9ROW7kKKxvfMHDGQVTR+cTGxIDdb+9\nEM75+vrh3ASiSn1DBlT8hx98A5OxaEJy1jLaAUlFPNhjH5zHpNDn2e0r1E5d3K3o\ndfOqWQKBgCo0HZyG7LNdf4p9uhu1hIn6iIt9EkaYpPgrXKO/NevkjzPrZsUn5reH\nHPqAcOB3NaEsSy4bXfrFXIG8lHmyoJJCXUxmreA126yuBUyv2c6rVv6ChWk7YAti\n02pUCRtEJ/s/2aa//TgFT3FKyN8KIcHwEH9j3pECBBMQS/+9YCk1\n-----END RSA PRIVATE KEY-----',
                    type: FieldType.Text,
                }),
                Object.assign(new FieldView(), {
                    name: 'Hostname',
                    value: 'home.example.com',
                    type: FieldType.Text,
                }),
                Object.assign(new FieldView(), {
                    name: 'Date',
                    value: 'January,3,1999',
                    type: FieldType.Text,
                }),
                Object.assign(new FieldView(), {
                    name: 'Public Key',
                    value: 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCtarzy4lQmSEjEgQ68fg5iOcYJ8L0ts/An9NdpdY1B+lWUhMQJw+QbCF3Cpol3qGXq1J62LdqUiDoiOjPJZqPfmawu7gTMIPrN9QbIumMC++sZW6NG0aDC1zSL6JGfh/h9qgeU3k0sflUpGuzRG06EIDv21OXee1tJ2eBQTpINXDluY5q5v7aQF6Jkeo40KjKN9iLJa+fHLiuS/wjkZ/IXJ+EDaUZ9Rrl0MHXnZ7VYA+I698IP/lTWYQjQlhGgrdcEi//m8VAo5Lsy/Dy3EIl54AYRQeUdQTTax+mTHSl0Spa6isEBtpua4BCS3jFlikjxyaL4jbc7JvMv+bwlD6pT frank@frank-PC',
                    type: FieldType.Text,
                }),
            ],
        }),
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
});
