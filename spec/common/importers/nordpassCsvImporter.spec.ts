import { NordPassCsvImporter as Importer } from '../../../src/importers/nordpassCsvImporter';

import { CipherType, SecureNoteType } from '../../../src/enums';
import { CipherView } from '../../../src/models/view/cipherView';

import { data as creditCardData } from './testData/nordpassCsv/nordpass.card.csv';
import { data as identityData } from './testData/nordpassCsv/nordpass.identity.csv';
import { data as loginData } from './testData/nordpassCsv/nordpass.login.csv';
import { data as secureNoteData } from './testData/nordpassCsv/nordpass.secureNote.csv';

function expectLogin(cipher: CipherView) {
    expect(cipher.type).toBe(CipherType.Login);

    expect(cipher.name).toBe('SomeVaultItemName');
    expect(cipher.notes).toBe('Some note for the VaultItem');
    expect(cipher.login.uri).toBe('https://example.com');
    expect(cipher.login.username).toBe('hello@bitwarden.com');
    expect(cipher.login.password).toBe('someStrongPassword');
}

function expectCreditCard(cipher: CipherView) {
    expect(cipher.type).toBe(CipherType.Card);

    expect(cipher.name).toBe('SomeVisa');
    expect(cipher.card.brand).toBe('Visa');
    expect(cipher.card.cardholderName).toBe('SomeHolder');
    expect(cipher.card.number).toBe('4024007103939509');
    expect(cipher.card.code).toBe('123');
    expect(cipher.card.expMonth).toBe('1');
    expect(cipher.card.expYear).toBe('22');
}

function expectIdentity(cipher: CipherView) {
    expect(cipher.type).toBe(CipherType.Identity);

    expect(cipher.name).toBe('SomeTitle');
    expect(cipher.identity.fullName).toBe('myFirstname myMiddlename myLastname');
    expect(cipher.identity.firstName).toBe('myFirstname');
    expect(cipher.identity.middleName).toBe('myMiddlename');
    expect(cipher.identity.lastName).toBe('myLastname');
    expect(cipher.identity.email).toBe('hello@bitwarden.com');
    expect(cipher.identity.phone).toBe('123456789');

    expect(cipher.identity.address1).toBe('Test street 123');
    expect(cipher.identity.address2).toBe('additional addressinfo');
    expect(cipher.identity.postalCode).toBe('123456');
    expect(cipher.identity.city).toBe('Cologne');
    expect(cipher.identity.state).toBe('North-Rhine-Westphalia');
    expect(cipher.identity.country).toBe('GERMANY');
    expect(cipher.notes).toBe('SomeNoteToMyIdentity');
}

function expectSecureNote(cipher: CipherView) {
    expect(cipher.type).toBe(CipherType.SecureNote);

    expect(cipher.name).toBe('MySuperSecureNoteTitle');
    expect(cipher.secureNote.type).toBe(SecureNoteType.Generic);
    expect(cipher.notes).toBe('MySuperSecureNote');
}

describe('NordPass CSV Importer', () => {
    let importer: Importer;
    beforeEach(() => {
        importer = new Importer();
    });

    it('should parse login records', async () => {
        const result = await importer.parse(loginData);

        expect(result).not.toBeNull();
        expect(result.success).toBe(true);
        expect(result.ciphers.length).toBe(1);
        const cipher = result.ciphers[0];
        expectLogin(cipher);
    });

    it('should parse credit card records', async () => {
        const result = await importer.parse(creditCardData);

        expect(result).not.toBeNull();
        expect(result.success).toBe(true);
        expect(result.ciphers.length).toBe(1);
        const cipher = result.ciphers[0];
        expectCreditCard(cipher);
    });

    it('should parse identity records', async () => {
        const result = await importer.parse(identityData);

        expect(result).not.toBeNull();
        expect(result.success).toBe(true);
        expect(result.ciphers.length).toBe(1);
        const cipher = result.ciphers[0];
        expectIdentity(cipher);
    });

    it('should parse secureNote records', async () => {
        const result = await importer.parse(secureNoteData);

        expect(result).not.toBeNull();
        expect(result.success).toBe(true);
        expect(result.ciphers.length).toBe(1);
        const cipher = result.ciphers[0];
        expectSecureNote(cipher);
    });

    it('should parse an item and create a folder', async () => {
        const result = await importer.parse(secureNoteData);

        expect(result).not.toBeNull();
        expect(result.success).toBe(true);
        expect(result.folders.length).toBe(1);
        const folder = result.folders[0];
        expect(folder.name).toBe('notesFolder');
    });
});
