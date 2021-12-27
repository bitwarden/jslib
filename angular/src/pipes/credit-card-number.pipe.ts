import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'creditCardNumber' })
export class CreditCardNumberPipe implements PipeTransform {
    transform(creditCardNumber: string, brand: string): string {

        // See https://baymard.com/checkout-usability/credit-card-patterns for
        // all possible credit card spacing patterns. For now, we just handle
        // the below.

        // Check for Visa #### #### #### #### (4-4-4-4) - Pattern not known for 13-15 and 17-19 digit cards.
        if (creditCardNumber.length === 16 && brand === 'Visa' && creditCardNumber.substring(0,1) === '4') {
            return [
                creditCardNumber.slice(0, 4),
                creditCardNumber.slice(4, 8),
                creditCardNumber.slice(8, 12),
                creditCardNumber.slice(12),
            ].join('-');
        }
        // Check for MasterCard #### #### #### #### (4-4-4-4)
        if (creditCardNumber.length === 16 && brand === 'MasterCard' && (this.inRange(creditCardNumber.substring(0,2),51,55) || this.inRange(creditCardNumber.substring(0,6),222100,272099))) {
            return [
                creditCardNumber.slice(0, 4),
                creditCardNumber.slice(4, 8),
                creditCardNumber.slice(8, 12),
                creditCardNumber.slice(12),
            ].join('-');
        }

        // Check for Maestro #### #### ##### (4-4-5) #### ###### ##### (4-6-5) #### #### #### #### (4-4-4-4) #### #### #### #### ### (4-4-4-4-3)
        if (brand === 'Maestro' && (this.inRange(creditCardNumber.substring(0,6),500000,509999) || this.inRange(creditCardNumber.substring(0,6),560000,589999) || this.inRange(creditCardNumber.substring(0,6),600000,699999))) {
            if (creditCardNumber.length === 13) {
                return [
                    creditCardNumber.slice(0,4),
                    creditCardNumber.slice(4,8),
                    creditCardNumber.slice(8),
                ].join('-');
            }
            if (creditCardNumber.length === 15) {
                return [
                    creditCardNumber.slice(0, 4),
                    creditCardNumber.slice(4, 10),
                    creditCardNumber.slice(10),
                ].join('-');
            }
            if (creditCardNumber.length === 16) {
            return [
                creditCardNumber.slice(0, 4),
                creditCardNumber.slice(4, 8),
                creditCardNumber.slice(8, 12),
                creditCardNumber.slice(12),
            ].join('-');
            }
            if (creditCardNumber.length === 19) {
                return [
                    creditCardNumber.slice(0, 4),
                    creditCardNumber.slice(4, 8),
                    creditCardNumber.slice(8, 12),
                    creditCardNumber.slice(12,16),
                    creditCardNumber.slice(16),
                ].join('-');
                }
        }
        // Check for Discover
        if (creditCardNumber.length === 16 && brand === 'Discover' && (this.inRange(creditCardNumber.substring(0,6),622126,622925) || this.inRange(creditCardNumber.substring(0,3),644,649)  || creditCardNumber.substring(0,4) === '6011' || creditCardNumber.substring(0,2) === '65' )) {
            return [
                creditCardNumber.slice(0, 4),
                creditCardNumber.slice(4, 8),
                creditCardNumber.slice(8, 12),
                creditCardNumber.slice(12),
            ].join('-');
        }
        // Check for Diners Club 14 digit - #### ###### #### (4-6-4)
        if (creditCardNumber.length === 14 && brand === 'Diners Club' && (this.inRange(creditCardNumber.substring(0,3),300,305) || this.inRange(creditCardNumber.substring(0,2),38,39) || creditCardNumber.substring(0,2) === '36' )) {
            return [
                creditCardNumber.slice(0, 4),
                creditCardNumber.slice(4, 10),
                creditCardNumber.slice(10),
            ].join('-');
        }

        // Check for Diners Club 16 Digit - #### #### #### #### (4-4-4-4)
        if (creditCardNumber.length === 16 && brand === 'Diners Club' && (creditCardNumber.substring(0,2) === '54' || creditCardNumber.substring(0,2) === '55')) {
            return [
                creditCardNumber.slice(0, 4),
                creditCardNumber.slice(4, 8),
                creditCardNumber.slice(8, 12),
                creditCardNumber.slice(12),
            ].join('-');
        }

        // Check for JCB 16 digit - #### #### #### #### (4-4-4-4)
        if (creditCardNumber.length === 16 && brand === 'JCB' && (this.inRange(creditCardNumber.substring(0,4),3528,3589))) {
            return [
                creditCardNumber.slice(0, 4),
                creditCardNumber.slice(4, 8),
                creditCardNumber.slice(8, 12),
                creditCardNumber.slice(12),
            ].join('-');
        }
        // China UnionPay 16 digit pattern - #### #### #### #### (4-4-4-4) Pattern not known for 17-18 digit cards.
        if (creditCardNumber.length === 16 && brand === 'UnionPay' && creditCardNumber.substring(0,2) === '62') {
            return [
                creditCardNumber.slice(0, 4),
                creditCardNumber.slice(4, 8),
                creditCardNumber.slice(8, 12),
                creditCardNumber.slice(12),
            ].join('-');
        }
        // China UnionPay 19 digit pattern - ###### ############# (6-13) Pattern not known for 17-18 digit cards.
        if (creditCardNumber.length === 19 && brand === 'UnionPay' && creditCardNumber.substring(0,2) === '62') {
            return [
                creditCardNumber.slice(0, 6),
                creditCardNumber.slice(6),
            ].join('-');
        }

        // American Express is 15 digits in length making the pattern - #### ###### ##### (4-6-5)
        if (creditCardNumber.length === 15 && brand === 'Amex' && (creditCardNumber.substring(0,2) === '37' || creditCardNumber.substring(0,2) === '34')) {
            return [
                creditCardNumber.slice(0, 4),
                creditCardNumber.slice(4, 10),
                creditCardNumber.slice(10),
            ].join('-');
        }

        return creditCardNumber;
    }

    /**
     *
     * @param x this is the card number value that you want to compare to see if it fits the range.
     * @param min The minimum value, greater than or equal to.
     * @param max The maximum value, less than or equal to.
     * @returns boolean true or false value.
     */
    private inRange(x: string, min: number, max: number) {
        // Converting string to a number
        const xAsANumber = parseFloat(x);
        if( min <= xAsANumber && xAsANumber <= max) {
            return true;
        } else {
            return false;
        }


    }
}
