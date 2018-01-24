import { View } from './view';

import { Card } from '../domain/card';

export class CardView implements View {
    cardholderName: string;
    brand: string;
    number: string;
    expMonth: string;
    expYear: string;
    code: string;

    constructor(c?: Card) {
        // ctor
    }
}
