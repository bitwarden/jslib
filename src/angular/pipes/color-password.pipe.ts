import {
    Pipe,
    PipeTransform,
} from '@angular/core';

/**
 * A pipe that sanitizes HTML and highlights numbers and special characters (in different colors each).
 */
@Pipe({ name: 'colorPassword' })
export class ColorPasswordPipe implements PipeTransform {
    transform(password: string) {
        let colorizedPassword = '';
        for (let i = 0; i < password.length; i++) {
            let character = password[i];
            let isSpecial = false;
            // Sanitize HTML first.
            switch (character) {
                case '&':
                    character = '&amp;';
                    isSpecial = true;
                    break;
                case '<':
                    character = '&lt;';
                    isSpecial = true;
                    break;
                case '>':
                    character = '&gt;';
                    isSpecial = true;
                    break;
                case ' ':
                    character = '&nbsp;';
                    isSpecial = true;
                    break;
                default:
                    break;
            }
            let type = 'letter';
            if (isSpecial || character.match(/[^\w ]/)) {
                type = 'special';
            } else if (character.match(/\d/)) {
                type = 'number';
            }
            colorizedPassword += '<span class="password-' + type + '">' + character + '</span>';
        }
        return colorizedPassword;
    }
}
