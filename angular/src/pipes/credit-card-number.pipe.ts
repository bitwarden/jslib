import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'creditCardNumber' })
export class CreditCardNumberPipe implements PipeTransform {

    numberFormats = {
        Visa: [
          {
            cardLength: 16,
            blocks: [4, 4, 4, 4],
            startNumber: ['4'],
            substring: [1],
          },
        ],
        Mastercard: [
          {
            cardLength: 16,
            blocks: [4, 4, 4, 4],
            startNumber: [
              ['51', '55'],
              ['222100', '272099'],
            ],
            substring: [2, 6],
          },
        ],
        Maestro: [
          {
            cardLength: 16,
            blocks: [4, 4, 4, 4],
            startNumber: ['51', '55', '222100', '272099'],
            substring: [2, 6],
          },
          {
            cardLength: 13,
            blocks: [4, 4, 5],
            startNumber: ['51', '55', '222100', '272099'],
            substring: [2, 6],
          },
          {
            cardLength: 14,
            blocks: [4, 6, 5],
            startNumber: ['51', '55', '222100', '272099'],
            substring: [2, 6],
          },
          {
            cardLength: 19,
            blocks: [4, 4, 4, 4, 3],
            startNumber: [
              ['51', '55'],
              ['222100', '272099'],
            ],
            substring: [2, 6],
          },
        ],
        Discover: [
            {
                cardLength: 16,
                blocks: [4, 4, 4, 4],
                startNumber: [
                  ['622126','622925'],
                  ['644','649'],
                  ['6011'],
                  ['65']
                ],
                substring: [6,3,4,2],
              },
        ],
        'Diners Club': [
            {
                cardLength: 14,
                blocks: [4, 6, 4],
                startNumber: [
                  ['300','305'],
                  ['38','39'],
                  ['36'],
                ],
                substring: [3,2,2],
              },
        ],
        JCB: [
            {
                cardLength: 16,
                blocks: [4, 4, 4, 4],
                startNumber: [
                  ['3528','3589'],
                ],
                substring: [4],
              },
        ],
        UnionPay: [
            {
                cardLength: 16,
                blocks: [4, 4, 4, 4],
                startNumber: [
                  ['62'],
                ],
                substring: [2],
            },
            {
                cardLength: 19,
                blocks: [6,13],
                startNumber: [
                  ['62']
                ],
                substring: [2],
              },
        ],
        Amex: [
            {
                cardLength: 15,
                blocks: [4, 6, 5],
                startNumber: [
                  ['37'],
                  ['34']
                ],
                substring: [2,2],
              },
        ],
        Other: [
            {
                cardLength: 16,
                blocks: [4,4,4,4],
                startNumber: [
                    ['1']
                ],
                substring: [1],
              },
        ]
      };
    transform(creditCardNumber: string, brand: string): string {

        // See https://baymard.com/checkout-usability/credit-card-patterns for
        // all possible credit card spacing patterns. For now, we just handle
        // the below.
        let result: string;
        for (const [key, value] of Object.entries(this.numberFormats)) {
          if (brand === key) {
            value.forEach(possibleValue => {

              if (possibleValue.cardLength === creditCardNumber.length) {
                possibleValue.startNumber.forEach((startNumberData, i) => {
                  if (
                    this.inRange(
                      creditCardNumber.substring(0, possibleValue.substring[i]),
                      startNumberData[0],
                      startNumberData[1]
                    ) === true
                  ) {
                    const preFormattedCardValue: string[] = [];
                    let previousSlice = 0;
                    possibleValue.blocks.forEach((block, i) => {
                      const total = (block += previousSlice);
                      preFormattedCardValue.push(
                        creditCardNumber.slice(previousSlice, total)
                      );
                      previousSlice = block;
                    });
                    result = preFormattedCardValue.join('-');
                  }
                });
              }
            });
            if (brand === 'Other') {
                return [
                    creditCardNumber.slice(0, 4),
                    creditCardNumber.slice(4, 8),
                    creditCardNumber.slice(8, 12),
                    creditCardNumber.slice(12),
                ].join('-');
            }
          }
        }
        if (result === undefined) {
            return creditCardNumber;
        }
        return result;

    }

  /**
   *
   * @param x this is the card number value that you want to compare to see if it fits the range.
   * @param min The minimum value, greater than or equal to.
   * @param max The maximum value, less than or equal to.
   * @returns boolean true or false value.
   */
   private inRange(x: string, min: string, max?: string) {
    // Converting string to a number
    const xAsANumber = parseFloat(x);

    if ((parseFloat(min) <= xAsANumber && xAsANumber <= parseFloat(max)) || parseFloat(min) === xAsANumber) {
      return true;
    } else {
      return false;
    }
  }
}
