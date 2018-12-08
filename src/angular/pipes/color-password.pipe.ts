import { Pipe, PipeTransform } from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';

/**
 * A pipe that sanitizes HTML and highlights numbers and special characters (in different colors each).
 */
@Pipe({ name: 'colorPassword' })
export class ColorPasswordPipe implements PipeTransform {
    transform(password: string): SafeHtml {
        return password
            // Sanitize HTML first.
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            // Replace special chars (since that will exclude numbers anyway).
            .replace(/((&amp;|&lt;|&gt;|[^\w ])+)/g, `<span class="passwordSpecial">$1</span>`)
            // Finally replace the numbers.
            .replace(/(\d+)/g, `<span class="passwordNumber">$1</span>`);
    }
}
