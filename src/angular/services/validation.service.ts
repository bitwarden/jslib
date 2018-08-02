import {
    Injectable,
    SecurityContext,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import {
    BodyOutputType,
    Toast,
    ToasterService,
} from 'angular2-toaster';

import { I18nService } from '../../abstractions/i18n.service';

@Injectable()
export class ValidationService {
    constructor(private toasterService: ToasterService, private i18nService: I18nService,
        private sanitizer: DomSanitizer) { }

    showError(data: any): string[] {
        const defaultErrorMessage = this.i18nService.t('unexpectedError');
        const errors: string[] = [];

        if (data != null && typeof data === 'string') {
            errors.push(data);
        } else if (data == null || typeof data !== 'object') {
            errors.push(defaultErrorMessage);
        } else if (data.validationErrors == null) {
            errors.push(data.message ? data.message : defaultErrorMessage);
        } else {
            for (const key in data.validationErrors) {
                if (!data.validationErrors.hasOwnProperty(key)) {
                    continue;
                }

                data.validationErrors[key].forEach((item: string) => {
                    let prefix = '';
                    if (key.indexOf('[') > -1 && key.indexOf(']') > -1) {
                        const lastSep = key.lastIndexOf('.');
                        prefix = key.substr(0, lastSep > -1 ? lastSep : key.length) + ': ';
                    }
                    errors.push(prefix + item);
                });
            }
        }

        if (errors.length === 1) {
            this.toasterService.popAsync('error', this.i18nService.t('errorOccurred'), errors[0]);
        } else if (errors.length > 1) {
            let errorMessage = '';
            errors.forEach((e) => errorMessage += ('<p>' + this.sanitizer.sanitize(SecurityContext.HTML, e) + '</p>'));
            const toast: Toast = {
                type: 'error',
                title: this.i18nService.t('errorOccurred'),
                body: errorMessage,
                bodyOutputType: BodyOutputType.TrustedHtml,
                timeout: 5000 * errors.length,
            };
            this.toasterService.popAsync(toast);
        }

        return errors;
    }
}
