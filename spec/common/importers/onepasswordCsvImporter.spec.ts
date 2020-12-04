import { OnePasswordWinCsvImporter as Importer } from '../../../src/importers/onepasswordWinCsvImporter';

import { CipherType } from '../../../src/enums';

import { data as creditCardData } from './testData/onePasswordCsv/creditCard.csv'
import { data as identityData } from './testData/onePasswordCsv/identity.csv'

describe('1Password CSV Importer', () => {
    it('should parse identity imports', () => {
        const importer = new Importer();
        const result = importer.parse(identityData);

        expect(result).not.toBeNull();
        expect(result.success).toBe(true);
        expect(result.ciphers.length).toBe(1);
        const cipher = result.ciphers[0];
        expect(cipher.type).toBe(CipherType.Identity)

        expect(cipher.identity).toEqual(jasmine.objectContaining({
            firstName: 'first name',
            middleName: 'mi',
            lastName: 'last name',
            username: 'userNam3',
            company: 'bitwarden',
            phone: '8005555555',
            email: 'email@bitwarden.com'
        }));

        expect(cipher.notes).toContain('address\ncity state zip\nUnited States');
    });

    it('should parse credit card imports', () => {
        const importer = new Importer();
        const result = importer.parse(creditCardData);

        expect(result).not.toBeNull();
        expect(result.success).toBe(true);
        expect(result.ciphers.length).toBe(1);
        const cipher = result.ciphers[0];
        expect(cipher.type).toBe(CipherType.Card);

        expect(cipher.card).toEqual(jasmine.objectContaining({
            number: '4111111111111111',
            code: '111',
            cardholderName: 'test',
            expMonth: '1',
            expYear: '2030',
        }));
    });
});
