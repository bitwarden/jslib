import { CardView } from '../view/cardView';

import { Card as CardDomain } from '../domain/card';
import { CipherString } from '../domain/cipherString';

export class Card {
    static template(): Card {
        const req = new Card();
        req.cardholderName = 'John Doe';
        req.brand = 'visa';
        req.number = '4242424242424242';
        req.expMonth = '04';
        req.expYear = '2023';
        req.code = '123';
        return req;
    }

    static toView(req: Card, view = new CardView()) {
        view.cardholderName = req.cardholderName;
        view.brand = req.brand;
        view.number = req.number;
        view.expMonth = req.expMonth;
        view.expYear = req.expYear;
        view.code = req.code;
        return view;
    }

    static toDomain(req: Card, domain = new CardDomain()) {
        domain.cardholderName = req.cardholderName != null ? new CipherString(req.cardholderName) : null;
        domain.brand = req.brand != null ? new CipherString(req.brand) : null;
        domain.number = req.number != null ? new CipherString(req.number) : null;
        domain.expMonth = req.expMonth != null ? new CipherString(req.expMonth) : null;
        domain.expYear = req.expYear != null ? new CipherString(req.expYear) : null;
        domain.code = req.code != null ? new CipherString(req.code) : null;
        return domain;
    }

    cardholderName: string;
    brand: string;
    number: string;
    expMonth: string;
    expYear: string;
    code: string;

    constructor(o?: CardView | CardDomain) {
        if (o == null) {
            return;
        }

        if (o instanceof CardView) {
            this.cardholderName = o.cardholderName;
            this.brand = o.brand;
            this.number = o.number;
            this.expMonth = o.expMonth;
            this.expYear = o.expYear;
            this.code = o.code;
        } else {
            this.cardholderName = o.cardholderName?.encryptedString;
            this.brand = o.brand?.encryptedString;
            this.number = o.number?.encryptedString;
            this.expMonth = o.expMonth?.encryptedString;
            this.expYear = o.expYear?.encryptedString;
            this.code = o.code?.encryptedString;
        }
    }
}
