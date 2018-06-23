import * as papa from 'papaparse';

import { LoginUriView } from '../models/view/loginUriView';

export abstract class BaseImporter {
    protected passwordFieldNames = [
        'password', 'pass word', 'passphrase', 'pass phrase',
        'pass', 'code', 'code word', 'codeword',
        'secret', 'secret word', 'personpwd',
        'key', 'keyword', 'key word', 'keyphrase', 'key phrase',
        'form_pw', 'wppassword', 'pin', 'pwd', 'pw', 'pword', 'passwd',
        'p', 'serial', 'serial#', 'license key', 'reg #',

        // Non-English names
        'passwort'
    ];

    protected usernameFieldNames = [
        'user', 'name', 'user name', 'username', 'login name',
        'email', 'e-mail', 'id', 'userid', 'user id',
        'login', 'form_loginname', 'wpname', 'mail',
        'loginid', 'login id', 'log', 'personlogin',
        'first name', 'last name', 'card#', 'account #',
        'member', 'member #',

        // Non-English names
        'nom', 'benutzername'
    ];

    protected notesFieldNames = [
        "note", "notes", "comment", "comments", "memo",
        "description", "free form", "freeform",
        "free text", "freetext", "free",

        // Non-English names
        "kommentar"
    ];

    protected uriFieldNames: string[] = [
        'url', 'hyper link', 'hyperlink', 'link',
        'host', 'hostname', 'host name', 'server', 'address',
        'hyper ref', 'href', 'web', 'website', 'web site', 'site',
        'web-site', 'uri',

        // Non-English names
        'ort', 'adresse'
    ];

    protected parseCsv(data: string, header: boolean): any[] {
        const result = papa.parse(data, {
            header: header,
            encoding: 'UTF-8',
        });
        if (result.errors != null && result.errors.length > 0) {
            result.errors.forEach((e) => {
                // tslint:disable-next-line
                console.warn('Error parsing row ' + e.row + ': ' + e.message);
            });
            return null;
        }
        return result.data;
    }

    protected parseSingleRowCsv(rowData: string) {
        if (this.isNullOrWhitespace(rowData)) {
            return null;
        }
        const parsedRow = this.parseCsv(rowData, false);
        if (parsedRow != null && parsedRow.length > 0 && parsedRow[0].length > 0) {
            return parsedRow[0];
        }
        return null;
    }

    protected makeUriArray(uri: string | string[]): LoginUriView[] {
        if (uri == null) {
            return null;
        }

        if (typeof uri === 'string') {
            const loginUri = new LoginUriView();
            loginUri.uri = this.fixUri(uri);
            loginUri.match = null;
            return [loginUri];
        }

        if (uri.length > 0) {
            const returnArr: LoginUriView[] = [];
            uri.forEach((u) => {
                const loginUri = new LoginUriView();
                loginUri.uri = this.fixUri(u);
                loginUri.match = null;
                returnArr.push(loginUri);
            });
            return returnArr;
        }

        return null;
    }

    protected fixUri(uri: string) {
        if (uri == null) {
            return null;
        }
        uri = uri.toLowerCase().trim();
        if (uri.indexOf('://') === -1 && uri.indexOf('.') >= 0) {
            uri = 'http://' + uri;
        }
        if (uri.length > 1000) {
            return uri.substring(0, 1000);
        }
        return uri;
    }

    protected isNullOrWhitespace(str: string): boolean {
        return str == null || str.trim() === '';
    }

    protected getValueOrDefault(str: string, defaultValue: string = null): string {
        if (this.isNullOrWhitespace(str)) {
            return defaultValue;
        }
        return str;
    }

    protected splitNewLine(str: string): string[] {
        return str.split(/(?:\r\n|\r|\n)/);
    }

    // ref https://stackoverflow.com/a/5911300
    protected getCardBrand(cardNum: string) {
        if (this.isNullOrWhitespace(cardNum)) {
            return null;
        }

        // Visa
        let re = new RegExp('^4');
        if (cardNum.match(re) != null) {
            return 'Visa';
        }

        // Mastercard 
        // Updated for Mastercard 2017 BINs expansion
        if (/^(5[1-5][0-9]{14}|2(22[1-9][0-9]{12}|2[3-9][0-9]{13}|[3-6][0-9]{14}|7[0-1][0-9]{13}|720[0-9]{12}))$/
            .test(cardNum)) {
            return 'Mastercard';
        }

        // AMEX
        re = new RegExp('^3[47]');
        if (cardNum.match(re) != null) {
            return 'Amex';
        }

        // Discover
        re = new RegExp('^(6011|622(12[6-9]|1[3-9][0-9]|[2-8][0-9]{2}|9[0-1][0-9]|92[0-5]|64[4-9])|65)');
        if (cardNum.match(re) != null) {
            return 'Discover';
        }

        // Diners
        re = new RegExp('^36');
        if (cardNum.match(re) != null) {
            return 'Diners Club';
        }

        // Diners - Carte Blanche
        re = new RegExp('^30[0-5]');
        if (cardNum.match(re) != null) {
            return 'Diners Club';
        }

        // JCB
        re = new RegExp('^35(2[89]|[3-8][0-9])');
        if (cardNum.match(re) != null) {
            return 'JCB';
        }

        // Visa Electron
        re = new RegExp('^(4026|417500|4508|4844|491(3|7))');
        if (cardNum.match(re) != null) {
            return 'Visa';
        }

        return null;
    }
}
