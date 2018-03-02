export class CardApi {
    cardholderName: string;
    brand: string;
    number: string;
    expMonth: string;
    expYear: string;
    code: string;

    constructor(data: any) {
        this.cardholderName = data.CardholderName;
        this.brand = data.Brand;
        this.number = data.Number;
        this.expMonth = data.ExpMonth;
        this.expYear = data.ExpYear;
        this.code = data.Code;
    }
}
