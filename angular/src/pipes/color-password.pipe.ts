import {
    Pipe,
    PipeTransform,
} from '@angular/core';

/*
 An updated pipe that sanitizes HTML, highlights numbers and special characters (in different colors each)
 and handles Unicode / Emoji characters correctly.
*/
@Pipe({ name: 'colorPassword' })
export class ColorPasswordPipe implements PipeTransform {
    transform(password: string) {
        // Regex Unicode property escapes for checking if emoji in passwords.
        // Transpiled version of /\p{Emoji_Presentation}/gu using https://mothereff.in/regexpu. Used for compatability in older browsers.
        const regexpEmojiPresentation = /(?:[\u231A\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD\u25FE\u2614\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA\u26AB\u26BD\u26BE\u26C4\u26C5\u26CE\u26D4\u26EA\u26F2\u26F3\u26F5\u26FA\u26FD\u2705\u270A\u270B\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B\u2B1C\u2B50\u2B55]|\uD83C[\uDC04\uDCCF\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF7C\uDF7E-\uDF93\uDFA0-\uDFCA\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF4\uDFF8-\uDFFF]|\uD83D[\uDC00-\uDC3E\uDC40\uDC42-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDD7A\uDD95\uDD96\uDDA4\uDDFB-\uDE4F\uDE80-\uDEC5\uDECC\uDED0-\uDED2\uDED5-\uDED7\uDEEB\uDEEC\uDEF4-\uDEFC\uDFE0-\uDFEB]|\uD83E[\uDD0C-\uDD3A\uDD3C-\uDD45\uDD47-\uDD78\uDD7A-\uDDCB\uDDCD-\uDDFF\uDE70-\uDE74\uDE78-\uDE7A\uDE80-\uDE86\uDE90-\uDEA8\uDEB0-\uDEB6\uDEC0-\uDEC2\uDED0-\uDED6])/g;
        // Convert to an array to handle cases that stings have special characters, ie: emoji.
        const passwordArray = Array.from(password);
        let colorizedPassword = '';
        for (let i = 0; i < passwordArray.length; i++) {
            let character = passwordArray[i];
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
            if (character.match(regexpEmojiPresentation)) {
                type = 'emoji';
            } else if (isSpecial || character.match(/[^\w ]/)) {
                type = 'special';
            } else if (character.match(/\d/)) {
                type = 'number';
            }
            colorizedPassword += '<span class="password-' + type + '">' + character + '</span>';
        }
        return colorizedPassword;
    }
}
